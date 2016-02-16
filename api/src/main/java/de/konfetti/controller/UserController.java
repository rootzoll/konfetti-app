package de.konfetti.controller;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import de.konfetti.data.Client;
import de.konfetti.data.ClientAction;
import de.konfetti.data.User;
import de.konfetti.service.AccountingService;
import de.konfetti.service.ClientService;
import de.konfetti.service.UserService;
import de.konfetti.service.exception.AccountingTools;
import de.konfetti.utils.Helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    public UserController(final UserService userService, final ClientService clientService, final AccountingService accountingService) {
        this.userService = userService;
        this.clientService = clientService;
        this.accountingService = accountingService;
    }

    //---------------------------------------------------
    // USER Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST, produces = "application/json")
    public User createUser() {
    	
    	// create new user
    	User user = userService.create();
    	
    	// create new client
    	Client client = clientService.create(user.getId());
    	
    	// set client data on user and return
    	user.setClientId(client.getId());
    	user.setClientSecret(client.getSecret());
        return user;
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{userId}", method = RequestMethod.GET, produces = "application/json")
    public User readUser(@PathVariable Long userId, HttpServletRequest httpRequest) throws Exception {
    	
        User user = userService.findById(userId);
        if (user==null) throw new Exception("NOT FOUND user("+userId+")");
    	
    	// check if user is allowed to read
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that user is himself
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		if (!client.getUserId().equals(user.getId())) throw new Exception("client("+client.getId()+") is not allowed to read user("+userId+")");
    	
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
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
    	
        return userExisting;
    }
    
	class RedeemResponse {
		public List<ClientAction> actions;
		public String feedbackHtml;
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
    	
    	// TODO: implement code data base - work with fixed cheat codes for now
    	
    	// add 100 Konfetto #1
    	if (code.equals("1")) {
    		result.actions = makeUserAdminOnParty(user, 1l, result.actions);
    		addKonfettiOnParty(user, 1l, 100l, result.actions);
    		result.feedbackHtml = "Plus 100 konfetti.";
    	} else
    	// upgrade user to admin of party #1
    	if (code.equals("111")) {
    		result.actions = makeUserAdminOnParty(user, 1l, result.actions);
    		result.feedbackHtml = "You are now AMIN on party #1";
    	} else
    	
    	// upgrade user to reviewer of party #1
    	if (code.equals("11")) {
    		result.actions = makeUserReviewerOnParty(user, 1l, result.actions);
    		result.feedbackHtml = "You are now REVIEWER on party #1";
    	} else
    	
        // add 100 Konfetto #2
    	if (code.equals("2")) {
    		result.actions = makeUserAdminOnParty(user, 2l, result.actions);
        	addKonfettiOnParty(user, 2l, 100l, result.actions);
        	result.feedbackHtml = "Plus 100 konfetti.";
        } else
    		
    	// upgrade user to admin of party #2
    	if (code.equals("222")) {
    		result.actions = makeUserAdminOnParty(user, 2l, result.actions);
    		result.feedbackHtml = "You are now AMIN on party #2";
    	} else
    	
    	// upgrade user to reviewer of party #2
    	if (code.equals("22")) {
    		result.actions = makeUserReviewerOnParty(user, 2l, result.actions);
    		result.feedbackHtml = "You are now REVIEWER on party #2";
    	} else
    	
    	// CODE NOT KNOWN
    	{
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
		Long konfettiAfter = this.accountingService.addBalanceToAccount(userAccountName, konfettiAmount);
		
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
