package de.konfetti.controller;

import de.konfetti.data.Chat;
import de.konfetti.data.Client;
import de.konfetti.data.MediaItem;
import de.konfetti.data.Notification;
import de.konfetti.data.Party;
import de.konfetti.data.Request;
import de.konfetti.data.User;
import de.konfetti.data.mediaitem.MultiLang;
import de.konfetti.service.AccountingService;
import de.konfetti.service.ChatService;
import de.konfetti.service.ClientService;
import de.konfetti.service.MediaService;
import de.konfetti.service.NotificationService;
import de.konfetti.service.PartyService;
import de.konfetti.service.RequestService;
import de.konfetti.service.UserService;
import de.konfetti.service.exception.AccountingTools;
import de.konfetti.utils.AutoTranslator;
import de.konfetti.utils.Helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("konfetti/api/party")
public class PartyController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PartyController.class);
	
    private final PartyService partyService;

    private final RequestService requestService;
    
    private final NotificationService notificationService;
    
    private final ClientService clientService;
    
    private final AccountingService accountingService;
    
    private final UserService userService;
    
    private final ChatService chatService;
    
    private final MediaService mediaService;

    @Autowired
    public PartyController(
    		final PartyService partyService, 
    		final RequestService requestService, 
    		final NotificationService notificationService, 
    		final ClientService clientService, 
    		final AccountingService accountingService, 
    		final UserService userService,
    		final ChatService chatService,
    		final MediaService mediaService
    		) {
    	
        this.partyService = partyService;
        this.requestService = requestService;
        this.notificationService = notificationService;
        this.clientService = clientService;
        this.accountingService = accountingService;
        this.userService = userService;
        this.chatService = chatService;
        this.mediaService = mediaService;
       
    }

    //---------------------------------------------------
    // PARTY Controller
    //---------------------------------------------------

    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST)
    public Party createParty(@RequestBody @Valid final Party party, HttpServletRequest request) throws Exception  {
    	ControllerSecurityHelper.checkAdminLevelSecurity(request);
    	return partyService.create(party);
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.PUT)
    public Party updateParty(@RequestBody @Valid final Party party, HttpServletRequest request) throws Exception {
    	ControllerSecurityHelper.checkAdminLevelSecurity(request);
    	return partyService.update(party);
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{partyId}", method = RequestMethod.DELETE) 
    public boolean deleteParty(@PathVariable long partyId, HttpServletRequest request) throws Exception {
    	ControllerSecurityHelper.checkAdminLevelSecurity(request);
        partyService.delete(partyId);
        return true;
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{partyId}", method = RequestMethod.GET)
    public Party getParty(@PathVariable long partyId, HttpServletRequest request) throws Exception {
    	
    	Party party = partyService.findById(partyId);
    	
    	// if user/client is set by header -> add requests and notifications important to user
    	try {
			
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(request, clientService);
			
        	if (client!=null) {
 
        		User user = userService.findById(client.getUserId());
        		boolean userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), party.getId());
        		boolean userIsPartyReviewer = Helper.contains(user.getReviewerOnParties(), party.getId());
        	
        		List<Request> requests = requestService.getAllPartyRequests(partyId);
        		List<Notification> notifications = notificationService.getAllNotifications(partyId, client.getUserId());
        		if (requests==null) requests = new ArrayList<Request>();
        		if (notifications==null) notifications = new ArrayList<Notification>();
        		
        		// if not reviewer or admin then return just public and own requests
        		if ((!userIsPartyAdmin) && (!userIsPartyReviewer)) {
            		List<Request> filteredRequests = new ArrayList<Request>();
            		for (Request r : requests) {
    					if ((r.getUserId().equals(user.getId())) || (r.getState().equals(Request.STATE_DONE)) || (r.getState().equals(Request.STATE_PROCESSING)) || (r.getState().equals(Request.STATE_OPEN))) {
    						filteredRequests.add(r);
    					}
    				}	
            		requests = filteredRequests;
        		}
        		// TODO optional: filter requests and notifications if needed 
        	
        		party.setRequests(new HashSet<Request>(requests));
        		party.setNotifications(new HashSet<Notification>(notifications));
        		
        		// add accounting info
        		final String userAccountName = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), partyId);
        		Long userBalance = accountingService.getBalanceOfAccount(userAccountName);
        		if (userBalance == null) userBalance = 0l; 
        		party.setKonfettiCount(userBalance);
        		party.setKonfettiTotal(-1l); // TODO: implement statistic later
        		party.setTopPosition(-1); // TODO: implement statistic later
        	}
			
		} catch (Exception e) {
			e.printStackTrace();
			// exception can be ignored - because its just optional
			LOGGER.info("Was not able to get optional client info on request for party("+partyId+"): "+e.getMessage());
		}
    	
        return party;
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.GET)
    public List<Party> getAllParties(
    		@RequestParam(value="lat", defaultValue="0.0") String latStr,
    		@RequestParam(value="lon", defaultValue="0.0") String lonStr,
    		HttpServletRequest request ) throws Exception {
    	
    	// TODO: improve later by filter on GPS per search index
    	
    	List<Party> allParties = partyService.getAllParties();
    	List<Party> resultParties = new ArrayList<Party>();
    	    	
    	// keep only public parties
    	for (Party party : allParties) {
			if (party.getVisibility()==Party.VISIBILITY_PUBLIC) {
				resultParties.add(party);
			}
		}
    	allParties = new ArrayList<Party>(resultParties);
    	resultParties.clear();
    	
    	
    	if ((latStr.equals("0.0")) && (lonStr.equals("0.0"))) {
    		
    		// return all parties when lat & lon not given
    		
    		resultParties = allParties;
    	
    	} else {
    		
    		// filter parties when in reach of GPS
    		
    		double lat = Double.parseDouble(latStr);
    		double lon = Double.parseDouble(lonStr);
    		
    	
        	for (Party party : allParties) {
    		        		
        		// calc distance in meters (and set on object)
        		double distanceMetersDouble = Helper.distInMeters(lat, lon, party.getLat(), party.getLon());
        		long distanceMetersLong = Math.round(distanceMetersDouble);
        		if (distanceMetersLong>Integer.MAX_VALUE) distanceMetersLong = Integer.MAX_VALUE;
        		int distanceMeters = (int) distanceMetersLong;
        		
        		
        		// check if user GPS is within party area or party is global
        		if ((distanceMeters <= party.getMeters()) || (party.getMeters()==0)) {
        			
        			// use meters field to set distance for user perspective
            		party.setMeters(distanceMeters);
        			
            		// add to result list
        			resultParties.add(party);
        		}
        		
    		}
    	
    	}
    	
    	// try to personalize when client/user info is in header
    	try {
    		
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(request, clientService);
    		
    		if (client!=null) {
    		
        		// force add parties the user is member of (if not already in list)
    			User user = userService.findById(client.getUserId());
    			if (user!=null) {
    				Long[] mustHavePartyIds = user.getActiveOnParties();
    				if (mustHavePartyIds.length>0) {
    					// TODO: implement
    					LOGGER.warn("PartyController getAllParties(): TODO: mustHaveParty to add to partylist");
    				}
    			}
    			
    			// for all parties
    			for (final Party party : resultParties) {
				
    				final String accountName = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), party.getId());
    				
            		// add accounting info
            		Long userBalance = accountingService.getBalanceOfAccount(accountName);
            		
            		// if user is new on party (has no account yet)
            		if (userBalance == null) {
            			
            			userBalance = 0l; 
            			
        				LOGGER.info("New User("+client.getUserId()+") active on Party("+party.getId()+")");
            			
            			// create account
            			if (!accountingService.createAccount(accountName)) LOGGER.warn("Was not able to create balance account("+accountName+")");
            			
            			// make user member of party
            			Long[] activeParties = user.getActiveOnParties();
            			activeParties = Helper.append(activeParties, party.getId()); 
            			user.setActiveOnParties(activeParties);
            			userService.update(user);
            			
            			// welcome user
            			if (party.getWelcomeBalance()>0) {
            				
            				// transfer welcome konfetti
            				LOGGER.info("Transfer Welcome-Konfetti("+party.getWelcomeBalance()+") on Party("+party.getId()+") to User("+client.getUserId()+") with accountName("+accountName+")");
            				
            				try {
            				userBalance = accountingService.addBalanceToAccount(accountName, party.getWelcomeBalance());
            				} catch (Exception e) {
            					e.printStackTrace();
            				}
            				
            			}
            			
        				LOGGER.info("userBalance("+userBalance+")");

            		}
            		party.setKonfettiCount(userBalance);
            		
            		// disable statistics in this level
            		party.setKonfettiTotal(-1l); 
            		party.setTopPosition(-1);
    				
				}
    			
    		}
    		
    	} catch (Exception e) {
			// exception can be ignored - because its just optional
			LOGGER.info("Was not able to get optional client info on request for party list: "+e.getMessage());
		}
    	
        return resultParties;
 
    }
    
    //---------------------------------------------------
    // NOTIFICATION Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/notification/{notiId}", method = RequestMethod.GET)
    public Notification getNotification(@PathVariable long partyId, @PathVariable long notiId, @RequestParam(value="action", defaultValue="no") Long action, HttpServletRequest httpRequest) throws Exception {
        
    	LOGGER.info("PartyController getNotification("+notiId+") action("+action+") ...");
    	
    	// get notification
    	Notification noti = notificationService.findById(notiId);
    	if (noti==null) throw new Exception("notification("+notiId+") not found");
    	
    	// check if user is allowed to work on notification
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check if user is owner of notification
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsOwner = (noti.getUserId().equals(client.getUserId()));
    		if (!userIsOwner) throw new Exception("cannot action notification("+notiId+") - user is not noti owner");
    		
    	} else {
    		
    		// B) check for trusted application with administrator privilege	
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	/*
    	 * Action
    	 */
    	
    	if (action.equals("delete")) {
    		notificationService.delete(notiId);
    		LOGGER.info("Notification("+notiId+") DELETED");
    	}
    	
    	return noti;
    }   
    
    //---------------------------------------------------
    // REQUEST Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/{langCode}/request", method = RequestMethod.POST)
    public Request createRequest(@PathVariable long partyId, @PathVariable String langCode, @RequestBody @Valid final Request request, HttpServletRequest httpRequest) throws Exception {
        
    	// load party for background info
    	Party party = partyService.findById(partyId);
    	if (party==null) throw new Exception("party with id("+partyId+") not found");
    	
    	// get user info
    	Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    	if (client==null) throw new Exception("client not found");
    	User user = userService.findById(client.getUserId());
    	if (user==null) throw new Exception("user("+client.getUserId()+") not found");
    	
    	// check if request has minimal konfetti
    	if (request.getKonfettiCount()<0) throw new Exception("invalid konfetti on request");
    	if (request.getKonfettiCount()<party.getNewRequestMinKonfetti()) throw new Exception("not enough konfetti on request - is("+request.getKonfettiAdd()+") needed("+party.getNewRequestMinKonfetti()+")");
    	
    	// check if user has minimal konfetti
    	Long userBalance = accountingService.getBalanceOfAccount(AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), party.getId()));
    	if (userBalance==null) userBalance = 0l;
    	if (userBalance<request.getKonfettiCount()) throw new Exception("not enough konfetti on userbalance - is("+userBalance+") needed("+request.getKonfettiCount()+")");
    	
    	// write data better set by server
    	request.setTime(System.currentTimeMillis());
    	request.setUserId(client.getUserId());
    	request.setPartyId(partyId);
    	
    	// set state based on party settings
    	if (party.getReviewLevel()==Party.REVIEWLEVEL_NONE) {
    		request.setState(Request.STATE_OPEN);
    	} else {
    		request.setState(Request.STATE_REVIEW);
    		if (user.getPushActive()) LOGGER.warn("TODO: push info to review admin"); // TODO
    	}
    	
    	// update fields in user and persist
    	user.setImageUrl(request.getImageUrl());
    	user.setName(request.getUserName());
    	user.setSpokenLangs(request.getSpokenLangs());
    	userService.update(user);
    	
    	// title --> multi language
    	MultiLang multiLang = AutoTranslator.getInstance().translate(langCode, request.getTitle());
    	String json = new ObjectMapper().writeValueAsString(multiLang);
    	LOGGER.info("request title --autotranslate--> "+json);
    	MediaItem mediaItem = new MediaItem();
    	mediaItem.setData(json);
    	mediaItem.setLastUpdateTS(System.currentTimeMillis());
    	mediaItem.setReviewed(MediaItem.REVIEWED_PUBLIC);
    	mediaItem.setType(MediaItem.TYPE_MULTILANG);
    	mediaItem.setUserId(client.getUserId());
    	mediaItem = mediaService.create(mediaItem);
    	LOGGER.info("multilang stored with id("+mediaItem.getId()+")");
    	request.setTitleMultiLangRef(mediaItem.getId());
    	
    	// create request
    	Request persistent = requestService.create(request);
    	
    	// transfer balance to request account
    	accountingService.createAccount(AccountingTools.getAccountNameFromRequest(persistent.getId()));
    	if (request.getKonfettiCount()>0) {
    		accountingService.transfereBetweenAccounts(AccountingTools.getAccountNameFromUserAndParty(client.getUserId(),partyId), AccountingTools.getAccountNameFromRequest(persistent.getId()), request.getKonfettiCount());
    	}
    	
    	return persistent;
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.PUT)
    public Request updateRequest(@PathVariable long partyId, @RequestBody @Valid Request request, HttpServletRequest httpRequest) throws Exception {
    	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
        return requestService.update(request);
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/request/{requestId}", method = RequestMethod.DELETE)
    public Request deleteRequest(@PathVariable long partyId, @PathVariable long requestId, HttpServletRequest httpRequest) throws Exception {
    	    	
    	// get request that is to be deleted
    	Request request = requestService.findById(requestId);
    	if (request==null) throw new Exception("no request with id("+requestId+") found");
    	
    	// check if user is allowed to delete
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) client for user (party admin or reeuest author)
    		
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		User user = userService.findById(client.getUserId());
    		
    		boolean userIsAuthor = (request.getUserId().equals(client.getUserId()));
    		boolean userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), request.getPartyId());
    		LOGGER.info("delete request("+requestId+") ... client is author("+userIsAuthor+") partyAdmin("+userIsPartyAdmin+")");
    		
    		if ((!userIsAuthor) && (!userIsPartyAdmin)) throw new Exception("cannot delete request("+requestId+") - user is not request author or party admin");
    		
    	} else {
    		
    		// B) check for trusted application with administrator privilege
    		
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}

    	// TODO implement
    	LOGGER.warn("TODO: Implement payback of upvote konfetti when request is still open.");
    	
        return requestService.delete(request.getId());
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/request/{requestId}", method = RequestMethod.GET)
    public Request getRequest(@PathVariable long partyId, @PathVariable long requestId, @RequestParam(value="upvoteAmount", defaultValue="0") Long upvoteAmount, HttpServletRequest httpRequest) throws Exception {
        
    	LOGGER.info("PartyController getRequest("+requestId+") upvoteAmount("+upvoteAmount+") ...");
    	
    	Request request = requestService.findById(requestId);
        if (request!=null) {
        	
        	// add chats to request
        	List<Chat> chats = this.chatService.getAllByRequestId(request.getId());
        	if (chats==null) chats = new ArrayList<Chat>();
        	request.setChats(chats);
        	
        	// add media items to request // TODO
        	List<MediaItem> infos = null;
        	if (infos==null) infos = new ArrayList<MediaItem>();
        	request.setInfo(infos);
        	
        	// UPVOTE (optional when request parameter set)
        	if (upvoteAmount>0l) {
        		
        		LOGGER.info("Upvoting request("+requestId+") with amount("+upvoteAmount+") ...");
        		
        		// get user/client from request
        		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
        		if (client==null) throw new Exception("no valid client info on request - need for upvote");
        		
        		// check if user has enough balance
        		String userAccountname = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), partyId);
        		Long userBalance = accountingService.getBalanceOfAccount(userAccountname);
        		if (userBalance==null) throw new Exception("not able to get account balance of account("+userAccountname+")");
        		if (userBalance<upvoteAmount) throw new Exception("user("+client.getId()+") has not enough balance to upvote on party("+partyId+") - is("+userBalance+") needed("+upvoteAmount+")");
        		
        		// transfer amount
        		if (!accountingService.transfereBetweenAccounts(userAccountname, AccountingTools.getAccountNameFromRequest(requestId), upvoteAmount)) {
        			throw new Exception("was not able to transfer upvote amount("+upvoteAmount+") from("+userAccountname+") to("+AccountingTools.getAccountNameFromRequest(requestId)+")");
        		}
        		
        		LOGGER.info("... OK: transfer of upvote amount("+upvoteAmount+") from("+userAccountname+") to("+AccountingTools.getAccountNameFromRequest(requestId)+") done.");
        		
        	} else {
        		
          		LOGGER.info("no Upvoting - amount("+upvoteAmount+")");
        		
        	}
        	
        	// add account balance to request object
        	request.setKonfettiCount(accountingService.getBalanceOfAccount(AccountingTools.getAccountNameFromRequest(requestId)));
        	
        } else {
        	
        	LOGGER.warn("PartyController getRequest("+requestId+") --> NULL");
        }
        
        return request;
    }
    
    @SuppressWarnings("unchecked")
	@CrossOrigin(origins = "*")
    @RequestMapping(value = "/action/request/{requestId}", method = RequestMethod.GET)
    public Request actionRequest(@PathVariable long requestId, @RequestParam(value="action", defaultValue="no") String action, @RequestParam(value="json", defaultValue="") String json , HttpServletRequest httpRequest) throws Exception {
    
    	Request request = requestService.findById(requestId);
        if (request!=null) {
        	
        	if (action.equals("no")) throw new Exception("missing parameter action");
        	
        	// check if user is allowed to work on request
    		boolean userIsAuthor = false;
    		boolean userIsPartyAdmin = false;
    		boolean userIsPartyReviewer = false;
        	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
        		
        		// A) client for user (party admin, reviewer or request author)
        		
        		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
        		User user = userService.findById(client.getUserId());
        		
        		userIsAuthor = (request.getUserId().equals(client.getUserId()));
        		userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), request.getPartyId());
        		userIsPartyReviewer = Helper.contains(user.getReviewerOnParties(), request.getPartyId());
        		LOGGER.info("action request("+requestId+") ... client is author("+userIsAuthor+") partyAdmin("+userIsPartyAdmin+") partyReview("+userIsPartyReviewer+")");
        		
        		if ((!userIsAuthor) && (!userIsPartyAdmin) && (!userIsPartyReviewer)) throw new Exception("cannot action request("+requestId+") - user is not request author or party admin or reviewer");
        		
        	} else {
        		
        		// B) check for trusted application with administrator privilege
        		
            	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
            	userIsPartyAdmin = true;
        	}
        	
        	/*
        	 * Actions
        	 */
        	
        	// open from review (by admin and reviewer)
        	if (action.equals(Request.STATE_OPEN)) {
        		
        		// check if pre-state is valid
        		if (!request.getState().equals(Request.STATE_REVIEW)) throw new Exception("request("+requestId+") with state("+request.getState()+") CANNOT set to '"+Request.STATE_OPEN+"'");
        		
        		// check if admin or reviewer
        		if ((!userIsPartyAdmin) && (!userIsPartyReviewer)) throw new Exception("request("+requestId+") author cannot set to open");
        	
        		// set open & persists
        		request.setState(Request.STATE_OPEN);
        		requestService.update(request);
        		LOGGER.info("request("+requestId+") set STATE to "+Request.STATE_OPEN);
        		
        		// TODO
        		LOGGER.warn("TODO: Implement send notification to author");
        		
        	} else
        	
        	// set processing (by all)
        	if (action.equals(Request.STATE_PROCESSING)) {
        		
        		// check if pre-state is valid
        		if (!request.getState().equals(Request.STATE_OPEN)) throw new Exception("request("+requestId+") with state("+request.getState()+") CANNOT set to '"+Request.STATE_PROCESSING+"'");
        		
        		// set processing & persists
        		request.setState(Request.STATE_PROCESSING);
        		requestService.update(request);
        		LOGGER.info("request("+requestId+") set STATE to "+Request.STATE_PROCESSING);
        		
        	} else
        	
        	// set rejected (by admin and reviewer)
        	if (action.equals(Request.STATE_REJECTED)) {
        		
        		// check if admin or reviewer
        		if ((!userIsPartyAdmin) && (!userIsPartyReviewer)) throw new Exception("request("+requestId+") author cannot set to rejected");
        		
        		// set processing & persists
        		request.setState(Request.STATE_REJECTED);
        		requestService.update(request);
        		LOGGER.info("request("+requestId+") set STATE to "+Request.STATE_REJECTED);
        		
        		// TODO
        		LOGGER.warn("TODO: Implement send notification to author");
        		
        	} else
        		
            // set rejected (by admin and author)
            if (action.equals("reward")) {
      
            	// needed json data
            	if ((json==null) || (json.length()==0)) throw new Exception("minning parameter json");
            	List<Long> ids = new ArrayList<Long>();
            	try {
            		ids = (new ObjectMapper()).readValue(json, ids.getClass());
            	} catch (Exception e) {
            		e.printStackTrace();
            		throw new Exception("json paramter not valid");
            	}
            	if (ids.isEmpty()) throw new Exception("json("+json+") is empty list if ids");
            	
            	// check if admin or reviewer
            	if ((!userIsPartyAdmin) && (!userIsAuthor)) throw new Exception("request("+requestId+") author cannot set to rejected");
            		
            	// TODO: check if ids have chats on request
            	
            	// get reward balance
            	final String requestAccountName = AccountingTools.getAccountNameFromRequest(request.getId());
            	Long requestBalance = accountingService.getBalanceOfAccount(requestAccountName);
            	if (requestBalance<ids.size()) throw new Exception("there are more rewardees than reward - not possible");
            	
            	// split reward
            	Long rewardPerPerson = (long) Math.floor((requestBalance*1d) / (ids.size()*1d));
            	if (((rewardPerPerson*ids.size())>requestBalance) || (rewardPerPerson<=0)) throw new Exception("reward("+requestBalance+") is not splitting up correctly to "+ids.size()+" --> "+rewardPerPerson);
            	
            	// transfere reward to users
            	for (Long rewardId : ids) {
					if (rewardId.equals(request.getUserId())) {
						LOGGER.warn("ignoring the author self-rewrad");
						continue;
					}
					final String rewardeeAccountName = AccountingTools.getAccountNameFromUserAndParty(rewardId, request.getPartyId());
					if (!accountingService.transfereBetweenAccounts(requestAccountName, rewardeeAccountName, rewardPerPerson)) {
						LOGGER.error("FAIL payout reward("+rewardPerPerson+") from("+requestAccountName+") to "+rewardeeAccountName);
					} else {
						LOGGER.error("OK payout reward("+rewardPerPerson+") from("+requestAccountName+") to "+rewardeeAccountName);
		            	// TODO
		            	LOGGER.warn("TODO: Implement send notification to rewardee");
					}
            	}
            	
            	// TODO: write payout history 
            	
            	// TODO: notification to all supporters of request about finish
            	
            	// set processing & persists
            	request.setState(Request.STATE_DONE);
            	requestService.update(request);
            	LOGGER.info("request("+requestId+") set STATE to "+Request.STATE_DONE);
            	
            } else
        		
            	
            // set rejected (by admin and reviewer)
            if (action.equals("muteChat")) {
            		
            	// needed json data
            	if ((json==null) || (json.length()==0)) throw new Exception("minning parameter json");
            	Long chatId = 0l;
            	try {
            		chatId = (new ObjectMapper()).readValue(json, chatId.getClass());
            	} catch (Exception e) {
            		e.printStackTrace();
            		throw new Exception("json paramter not valid");
            	}
            	
            	// try load chat
            	Chat chat = chatService.findById(chatId);
            	if (chat==null) throw new Exception("chat("+chatId+") not found");
            	if (!chat.getRequestId().equals(request.getId())) throw new Exception("chat("+chatId+") not on request("+requestId+")");
            	
            	// check if admin or author
            	if ((!userIsPartyAdmin) && (!userIsAuthor)) throw new Exception("request("+requestId+") not allowed to mute chat("+chatId+")");
            		
            	// mut chat & persists
            	chat.setMuted(true);
            	chatService.update(chat);
            	LOGGER.info("chat("+chatId+") on request("+requestId+") muted ");
            		
            	// TODO
            	LOGGER.warn("TODO: Implement send notification to muted chat user or add info as chat message");
            		
            } else
            	
        	// unkown action
        	{
        		throw new Exception("unkown action("+action+") on request("+requestId+")");
        	}
        	
        	
        } else {	
        	LOGGER.warn("PartyController getRequest("+requestId+") --> NULL");
        }
    	
    	return request;
    }
        
    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.GET)
    public List<Request> getAllPartyRequests(@PathVariable long partyId) throws Exception {
        return requestService.getAllPartyRequests(partyId);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    @ResponseBody
    public String handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ex.getMessage();
    }
    
}
