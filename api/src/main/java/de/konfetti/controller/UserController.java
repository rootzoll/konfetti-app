package de.konfetti.controller;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import de.konfetti.data.Client;
import de.konfetti.data.ClientAction;
import de.konfetti.data.User;
import de.konfetti.service.ClientService;
import de.konfetti.service.UserService;
import de.konfetti.utils.Helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
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

    @Autowired
    public UserController(final UserService userService, final ClientService clientService) {
        this.userService = userService;
        this.clientService = clientService;
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
    public User readUser(@PathVariable Long userId) {
        return userService.findById(userId);
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
