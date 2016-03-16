package de.konfetti.controller;

import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import de.konfetti.data.Client;
import de.konfetti.data.ClientAction;
import de.konfetti.data.Code;
import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.Party;
import de.konfetti.data.User;
import de.konfetti.service.AccountingService;
import de.konfetti.service.ClientService;
import de.konfetti.service.CodeService;
import de.konfetti.service.PartyService;
import de.konfetti.service.UserService;
import de.konfetti.utils.AccountingTools;
import de.konfetti.utils.EMailManager;
import de.konfetti.utils.Helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

@CrossOrigin
@RestController
@RequestMapping("konfetti/api/account")
public class UserController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserController.class);
    	
    private final UserService userService;
    private final ClientService clientService;
    private final AccountingService accountingService;
    private final PartyService partyService;
    private final CodeService codeService;
    
    private String passwordSalt;

    @Autowired
    private JavaMailSender javaMailSender;
    
    @Autowired
    public UserController(final UserService userService, final ClientService clientService, final AccountingService accountingService, final PartyService partyService, final CodeService codeService) {
        
    	this.userService = userService;
        this.clientService = clientService;
        this.accountingService = accountingService;
        this.partyService = partyService;
        this.codeService = codeService;
                
        this.passwordSalt = Helper.getPropValues("security.passwordsalt");
        if ((this.passwordSalt==null) || (this.passwordSalt.trim().length()==0)) throw new RuntimeException("security.passwordsalt is not set in application.properties");
        this.passwordSalt  = this.passwordSalt.trim();
    }
    
    //---------------------------------------------------
    // USER Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST, produces = "application/json")
    public User createUser(
    		@RequestParam(value="mail", defaultValue="") String email, 
    		@RequestParam(value="pass", defaultValue="") String pass, 
    		@RequestParam(value="locale", defaultValue="en") String locale ) throws Exception {
    	
    	boolean createWithCredentials = false;
    	if ((email!=null) && (email.length()>1)) {
    		
    		// check if credentials are available
    		if ((pass==null) || (pass.trim().length()==0)) { throw new Exception("password needs to be set");} 
    		pass = pass.trim();
    		createWithCredentials = true;
    		
        	// if email is set - check if email exists on other account
    		if (userService.findByMail(email)!=null) {
    			User errorUser = new User();
    			errorUser.setId(-1l);
    			return errorUser;
    		}
    		
    	}
    	
    	// create new user
    	User user = userService.create();
    	
    	if (createWithCredentials) {
        	user.seteMail(email.toLowerCase());
        	String passMD5 = Helper.hashPassword(this.passwordSalt, pass);
        	user.setPassword(passMD5);	
        	LOGGER.info("Create new User with eMail("+email+") and passwordhash("+passMD5+")");
           	// TODO --> email multi lang by lang set in user
        	if (!EMailManager.getInstance().sendMail(javaMailSender, email, "Konfetti Account Created", "username: "+email+"\npass: "+pass+"\n\nkeep email or write password down", null)) {
        		LOGGER.warn("was not able to send eMail on account creation to("+email+")");
        	}
    	}
    	
    	// set default spoken lang
    	String[] langs = {locale};
    	user.setSpokenLangs(langs);
    	userService.update(user);
    	
    	// create new client
    	Client client = clientService.create(user.getId());
    	
    	// set client data on user and return
    	user.setClientId(client.getId());
    	user.setClientSecret(client.getSecret());
    	
    	// keep password hash just on server side
    	user.setPassword("");
    	
        return user;
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{userId}", method = RequestMethod.GET, produces = "application/json")
    public User readUser(@PathVariable Long userId, HttpServletRequest httpRequest) throws Exception {
    	
        User user = userService.findById(userId);
        if (user==null) {
			LOGGER.warn("NOT FOUND user("+userId+")");
			user = new User();
			user.setId(0l); // 0 --> signal, that client auth failed
			return user;
        }
    
    	// check if user is allowed to read
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that user is himself
    		Client client;
    		try {
    			client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		} catch (Exception e) {
    			LOGGER.warn("Exception on readUser (get client): "+e.getMessage());
    			user = new User();
    			user.setId(0l); // 0 --> signal, that client auth failed
    			return user;
    		}
    		if (!client.getUserId().equals(user.getId())) throw new Exception("client("+client.getId()+") is not allowed to read user("+userId+")");
    	
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	// keep password hash just on server side
    	user.setPassword("");
    	
        return user;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/login", method = RequestMethod.GET, produces = "application/json")
    public User login(@RequestParam(value="mail", defaultValue="") String email, @RequestParam(value="pass", defaultValue="") String pass) throws Exception {
    	
    	// check user and input data
        User user = userService.findByMail(email.toLowerCase());
        if (user==null) {
        	LOGGER.warn("LOGIN FAIL: user not found with mail("+email+")");
        	throw new Exception("User and/or Passwort not valid.");
        }
        if ((pass==null) || (pass.trim().length()==0)) {
        	LOGGER.warn("LOGIN FAIL: password is null or zero length");
        	throw new Exception("User and/or Passwort not valid.");
        }
        pass = pass.trim();
        
        // check password
    	String passMD5 = Helper.hashPassword(this.passwordSalt, pass);
    	if (!passMD5.equals(user.getPassword())) {
        	LOGGER.warn("LOGIN FAIL: given passwordMD5("+passMD5+") is not passwordMD5 on user ("+user.getPassword()+")");
    		throw new Exception("User and/or Passwort not valid.");
    	}
   	
    	// create new client for session
    	Client client = clientService.create(user.getId());
    	
    	// set client data on user and return
    	user.setClientId(client.getId());
    	user.setClientSecret(client.getSecret());
    		
    	// keep password hash just on server side
    	user.setPassword("");
    	
    	return user;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/recover", method = RequestMethod.GET, produces = "application/json")
    public User recover(@RequestParam(value="mail", defaultValue="") String email) throws Exception {
    	
    	// check user and input data
        User user = userService.findByMail(email.toLowerCase());
        if (user==null) {
        	LOGGER.warn("RECOVER FAIL: user not found with mail("+email+")");
        	throw new Exception("mail not found");
        }
        
        // reset password
        String pass = Code.generadeCodeNumber()+"";
    	String passMD5 = Helper.hashPassword(this.passwordSalt, pass);
    	user.setPassword(passMD5);
    	userService.update(user);
   	
    	// send by email
    	// TODO --> email multi lang by lang set in user
    	if (!EMailManager.getInstance().sendMail(javaMailSender, email, "Konfetti Account Password Reset", "username: "+email+"\npass: "+pass+"\n\nkeep email or write password down", null)) {
    		LOGGER.warn("was not able to send eMail on account creation to("+email+")");
    	}
    	
    	// keep password hash just on server side
    	user.setPassword("");
    	
    	return user;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{userId}", method = RequestMethod.PUT, produces = "application/json")
    public User updateUser( @RequestBody @Valid final User userInput, HttpServletRequest httpRequest) throws Exception {
    	
        User userExisting = userService.findById(userInput.getId());
        if (userExisting==null) throw new Exception("NOT FOUND user("+userInput.getId()+")");
    	
    	// check if user is allowed to read
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that user is himself
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		if (!client.getUserId().equals(userExisting.getId())) throw new Exception("client("+client.getId()+") is not allowed to read user("+userExisting.getId()+")");
    	
    		// B) check if email got changed
    		if ((userInput.geteMail()!=null) && (!userInput.geteMail().equals(userExisting.geteMail()))) {
    			// TODO create backup code and send per eMail
    			// TODO multiple language eMail text
    			userExisting.seteMail(userInput.geteMail());
    			EMailManager.getInstance().sendMail(javaMailSender, userInput.geteMail(), "Your Konfetti eMail Setup", "Thanks for connecting your eMail with the Konfetti App", null);
    		}
    		
        	// transfer selective values from input to existing user
        	userExisting.seteMail(userInput.geteMail());
        	userExisting.setImageMediaID(userInput.getImageMediaID());
        	userExisting.setName(userInput.getName());
        	userExisting.setPushActive(userInput.getPushActive());
        	userExisting.setPushSystem(userInput.getPushSystem());    	
        	userExisting.setSpokenLangs(userInput.getSpokenLangs()); 
    		
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
        	
        	// complete overwrite allowed
        	userExisting = userInput;
        	
    	}
    	
    	// update user in persistence
    	userService.update(userExisting);
    	
    	// keep password hash just on server side
    	userExisting.setPassword("");
    	
        return userExisting;
    }
    
	class RedeemResponse {
		public List<ClientAction> actions;
		public String feedbackHtml;
	}

    @SuppressWarnings("deprecation")
	@CrossOrigin(origins = "*")
    @RequestMapping(value="/coupons/{partyId}", method = RequestMethod.GET, produces = "application/json") 
    public Boolean generateCodes(@PathVariable Long partyId, 
    		@RequestParam(value="count", defaultValue="0") Integer count,
    		@RequestParam(value="amount", defaultValue="0") Integer amount,
    		@RequestParam(value="email", defaultValue="") String email,
    		@RequestParam(value="locale", defaultValue="en") String locale, 
    		HttpServletRequest httpRequest) throws Exception {
    	
    	String mailConf = Helper.getPropValues("spring.mail.host");
    	if ((mailConf==null) || (mailConf.trim().length()==0)) {
    		String runningProfile = Helper.getPropValues("spring.profiles.active");
    		LOGGER.info("Running Profile: "+runningProfile);
    		if ("test".equals(runningProfile)) {
    			mailConf=null;
    			LOGGER.warn("running without mail config - see application.properties");
    		} else {
        		throw new Exception("eMail is not configured in application.properties - cannot generate/send coupons");	
    		}
    	}
    	
    	if (count<=0) throw new Exception("must be more than 0 coupons");
    	if (amount<=0) throw new Exception("must be more than 0 per coupon");
    	
    	// get user from HTTP request
    	Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    	if (client==null) throw new Exception("invalid/missing client on request");
    	User user = userService.findById(client.getUserId());
    	if (user==null) throw new Exception("missing user with id("+client.getUserId()+")");
    	
    	// check if party exists
    	Party party = partyService.findById(partyId);
    	if (party==null) throw new Exception("party does not exist");
    	
    	// check if user is admin for party
    	if (!Helper.contains(user.getAdminOnParties(), party.getId())) throw new Exception("user needs to be admin on party");
    	
    	// check if user has set email
    	if (email.trim().length()==0) email = user.geteMail();
    	if ((email==null) || (email.trim().length()<4)) throw new Exception("user needs to have a valid email on account");
    	
    	// generate codes
    	List<String> codes = new ArrayList<String>();
    	for (int i=0; i<count; i++) {
    		Code code = this.codeService.createKonfettiCoupon(partyId, client.getUserId(), new Long(amount));
    		System.out.println("Generated CouponCode: "+code.getCode());
    		codes.add(code.getCode());
    	}
    	
    	// URL max 8KB
    	String urlStr = "";
    	for (String code : codes) {
    		urlStr += (","+code);
		}
    	urlStr = "http://localhost:2342/generate?template="+URLEncoder.encode("coupon-master-template.html")+"&amount="+amount+"&codes=" +URLEncoder.encode(urlStr.substring(1));
    	if (urlStr.length()>(6*1024)) LOGGER.warn("the URL to generate the codes is >6KB - limit is 8KB - may become critical");
    	if (urlStr.length()>(8*1024)) throw new Exception("the URL to generate the codes is >8KB - thats bigger than URL GET data can be with NodeJS");
    	
    	LOGGER.info("URL to generate Coupons: "+urlStr);
    	
    	if ((mailConf!=null) && (!EMailManager.getInstance().sendMail(javaMailSender, email.trim(), "Konfetti Coupons "+System.currentTimeMillis(), "Print out the PDF attached and spread the love :)", urlStr))) {
    		throw new Exception("Was not able to send eMail with Coupons to "+user.geteMail());
    	};
    	
    	return true;
    }
    
    class ResponseZip2Gps {
    	public int resultCode = 0;
    	public double lat = 0d;
    	public double lon = 0d;
    }
	
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/zip2gps/{country}/{code}", method = RequestMethod.GET, produces = "application/json") 
    public ResponseZip2Gps redeemCode(@PathVariable String country, @PathVariable String code) throws Exception {
    	ResponseZip2Gps result = new ResponseZip2Gps();
    	result.resultCode = -1;
    	try {
    		System.out.println("ZIP2GPS country("+country+") zip("+code+") -->");
    		Scanner scanner = new Scanner(new URL("https://maps.googleapis.com/maps/api/geocode/json?address="+code+","+country).openStream(), "UTF-8");
    		String json = scanner.useDelimiter("\\A").next();
    		scanner.close();
    		int i = json.indexOf("\"location\" : {");
    		int e = 0;
    		if (i>0) {
    			i+=14;
    			json = json.substring(i);
    			i = json.indexOf("\"lat\" : ");
    			if (i>0) {
    				i+=8;
    				e = json.indexOf(",", i);
    				String latStr = json.substring(i,e).trim();
    				System.out.println("LAT("+latStr+")");
    				result.lat = Double.parseDouble(latStr);
    			}
    			i = json.indexOf("\"lng\" : ");
    			if (i>0) {
    				i+=8;
    				e = json.indexOf("}", i);
    				String lngStr = json.substring(i,e).trim();
    				System.out.println("LNG("+lngStr+")");
    				result.lon = Double.parseDouble(lngStr);
    			}
    			result.resultCode = 0;
    		}
    	} catch (Exception e) {
    		e.printStackTrace();
    	}
    	return result;
    }
    	    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/redeem/{code}", method = RequestMethod.GET, produces = "application/json") 
    public RedeemResponse redeemCode(@PathVariable String code, @RequestParam(value="locale", defaultValue="en") String locale, HttpServletRequest httpRequest) throws Exception {
    	    	
    	if (code==null) throw new Exception("code is not valid");
    	if (!locale.equals("en")) LOGGER.warn("TODO: implement reedem code feedback in locale '"+locale+"'"); // TODO
    	
    	// get user from HTTP request
    	Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    	if (client==null) throw new Exception("invalid/missing client on request");
    	User user = userService.findById(client.getUserId());
    	if (user==null) throw new Exception("missing user with id("+client.getUserId()+")");
    	
    	RedeemResponse result = new RedeemResponse();
    	
    	result.actions = new ArrayList<ClientAction>();
    	
    	// try to redeemcode
    	Code coupon = this.codeService.redeemByCode(code);
    	
    	// just if backend is running on in test mode allow cheat codes  
    	if ("test".equals(Helper.getPropValues("spring.profiles.active"))) {
    		
    		// --> creating coupons that are not in the database for testing
    		
        	// add 100 Konfetto #1
        	if (code.equals("1")) {
        		coupon = new Code();
        		coupon.setAmount(100l);
        		coupon.setPartyID(1l);
        		coupon.setUserID(0l);
        		coupon.setCode("1");
        		coupon.setActionType(Code.ACTION_TYPE_KONFETTI);
        	} else
        	// upgrade user to admin of party #1
        	if (code.equals("111")) {
        		coupon = new Code();
        		coupon.setPartyID(1l);
        		coupon.setCode("111");
        		coupon.setActionType(Code.ACTION_TYPE_ADMIN);
        	} else
        	
        	// upgrade user to reviewer of party #1
        	if (code.equals("11")) {
        		coupon = new Code();
        		coupon.setPartyID(1l);
        		coupon.setCode("11");
        		coupon.setActionType(Code.ACTION_TYPE_REVIEWER);
        	} else
        	
            // add 100 Konfetto #2
        	if (code.equals("2")) {
        		coupon = new Code();
        		coupon.setAmount(100l);
        		coupon.setPartyID(2l);
        		coupon.setUserID(0l);
        		coupon.setCode("2");
        		coupon.setActionType(Code.ACTION_TYPE_KONFETTI);
            } else
        		
        	// upgrade user to admin of party #2
        	if (code.equals("222")) {
        		coupon = new Code();
        		coupon.setPartyID(2l);
        		coupon.setCode("222");
        		coupon.setActionType(Code.ACTION_TYPE_ADMIN);
        	} else
        	
        	// upgrade user to reviewer of party #2
        	if (code.equals("22")) {
        		coupon = new Code();
        		coupon.setPartyID(2l);
        		coupon.setCode("22");
        		coupon.setActionType(Code.ACTION_TYPE_REVIEWER);
        	}
    	}
    	
    	if (coupon!=null) {
    		
    		// redeem konfetti
    		if (Code.ACTION_TYPE_KONFETTI==coupon.getActionType()) {
        		result.actions = addKonfettiOnParty(user, coupon.getPartyID(), coupon.getAmount(), result.actions);
        	   	// TODO --> multi lang by lang set in user
        		result.feedbackHtml = "You got now "+coupon.getAmount()+" konfetti to create a task with or upvote other ideas.";
    		} else
    			
        	// promote user to reviewer
        	if (Code.ACTION_TYPE_REVIEWER==coupon.getActionType()) {
        		result.actions = makeUserReviewerOnParty(user, coupon.getPartyID(), result.actions);
        	   	// TODO --> multi lang by lang set in user
        		result.feedbackHtml = "You are now REVIEWER on the following party.";
        	} else
        		
            // promote user to admin
            if (Code.ACTION_TYPE_ADMIN==coupon.getActionType()) {
        		result.actions = makeUserAdminOnParty(user, coupon.getPartyID(), result.actions);
        	   	// TODO --> multi lang by lang set in user
        		result.feedbackHtml = "You are now ADMIN on the following party.";        			
            }
    		
    	} else
    	
    	// CODE NOT KNOWN
    	{
    	   	// TODO --> multi lang by lang set in user
    		result.feedbackHtml = "Sorry. The code '"+code+"' is not known or unvalid.";
    	}	
    
    	return result;
    }

	private List<ClientAction> makeUserAdminOnParty(User user, Long partyId, List<ClientAction> actions) {
		
		Long[] arr = user.getAdminOnParties();
		if (!Helper.contains(arr, partyId)) arr = Helper.append(arr, partyId);
		user.setAdminOnParties(arr);
		userService.update(user);
		
		LOGGER.info("user("+user.getId()+") is now ADMIN on party("+partyId+")");
		
		actions = addUpdateUserAction(actions, user);
		actions = addFocusPartyAction(actions, partyId);
		
		return actions;
	}    

	private List<ClientAction> makeUserReviewerOnParty(User user, Long partyId, List<ClientAction> actions) {
		
		Long[] arr = user.getReviewerOnParties();
		if (!Helper.contains(arr, partyId)) arr = Helper.append(arr, partyId);
		user.setReviewerOnParties(arr);
		userService.update(user);
		
		LOGGER.info("user("+user.getId()+") is now REVIEWER on party("+partyId+")");
		
		actions = addUpdateUserAction(actions, user);
		actions = addFocusPartyAction(actions, partyId);
		
		return actions;
	}  
	
	private List<ClientAction> addKonfettiOnParty(User user, Long partyId, Long konfettiAmount, List<ClientAction> actions) throws Exception {

		final String userAccountName = AccountingTools.getAccountNameFromUserAndParty(user.getId(), partyId);
		Long konfettiBefore = this.accountingService.getBalanceOfAccount(userAccountName);
		Long konfettiAfter = this.accountingService.addBalanceToAccount(KonfettiTransaction.TYPE_COUPON, userAccountName, konfettiAmount);
		
		if (konfettiBefore.equals(konfettiAfter)) throw new Exception("adding amount failed");
		
		LOGGER.info("user("+user.getId()+") on party("+partyId+") +"+konfettiAmount+" konfetti");
		
		actions = addFocusPartyAction(actions, partyId);
		
		return actions;
	}  
	
	private List<ClientAction> addUpdateUserAction(List<ClientAction> actions, User actualUser) {
		String userJson = null;
		try {
			userJson = new ObjectMapper().writeValueAsString(actualUser);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	ClientAction a = new ClientAction();
    	a.command = "updateUser";
    	a.json = userJson;
    	actions.add(a);
    	return actions;
	}
	
	private List<ClientAction> addFocusPartyAction(List<ClientAction> actions, Long partyId) {
    	ClientAction a = new ClientAction();
    	a.command = "focusParty";
    	a.json = ""+partyId;
    	actions.add(a);
    	return actions;
	}
	
}
