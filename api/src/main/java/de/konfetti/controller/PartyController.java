package de.konfetti.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.konfetti.data.*;
import de.konfetti.data.mediaitem.MultiLang;
import de.konfetti.service.*;
import de.konfetti.utils.AccountingTools;
import de.konfetti.utils.AutoTranslator;
import de.konfetti.utils.Helper;
import de.konfetti.websocket.CommandMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static de.konfetti.data.NotificationType.*;

@Slf4j
@CrossOrigin
@RestController
@RequestMapping("konfetti/api/party")
public class PartyController {

	private static final Gson GSON = new GsonBuilder().create();

	private final PartyService partyService;

	private final RequestService requestService;

	private final NotificationService notificationService;

	private final ClientService clientService;

	private final AccountingService accountingService;

	private final UserService userService;

	private final ChatService chatService;

	private final MediaService mediaService;

	private final KonfettiTransactionService konfettiTransactionService;

	@Autowired
	private SimpMessagingTemplate webSocket;

	@Autowired
	public PartyController(
			final PartyService partyService,
			final RequestService requestService,
			final NotificationService notificationService,
			final ClientService clientService,
			final AccountingService accountingService,
			final UserService userService,
			final ChatService chatService,
			final MediaService mediaService,
			final KonfettiTransactionService konfettiTransactionService
	) {

		this.partyService = partyService;
		this.requestService = requestService;
		this.notificationService = notificationService;
		this.clientService = clientService;
		this.accountingService = accountingService;
		this.userService = userService;
		this.chatService = chatService;
		this.mediaService = mediaService;
		this.konfettiTransactionService = konfettiTransactionService;

	}

	//---------------------------------------------------
	// DASHBOARD Info
	//---------------------------------------------------

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/dashboard", method = RequestMethod.GET)
	public DashBoardInfo getDashBaordInfo(HttpServletRequest request) throws Exception {

		ControllerSecurityHelper.checkAdminLevelSecurity(request);
		DashBoardInfo info = new DashBoardInfo();

		info.numberOfUsers = userService.getNumberOfActiveUsers();
		info.numberOfParties = partyService.getNumberOfParties();
		info.numberOfTasks = requestService.getNumberOfRequests();
		info.numberOfKonfetti = accountingService.getAllKonfettiBalance();

		return info;
	}

	@CrossOrigin(origins = "*")
	@RequestMapping(method = RequestMethod.POST)
	public Party createParty(@RequestBody @Valid final Party party, HttpServletRequest request) throws Exception {
		ControllerSecurityHelper.checkAdminLevelSecurity(request);
		log.info("ADMIN: Creating PARTY(" + party.getId() + ")");
		return partyService.create(party);
	}

	//---------------------------------------------------
	// PARTY Controller
	//---------------------------------------------------

	@CrossOrigin(origins = "*")
	@RequestMapping(method = RequestMethod.PUT)
	public Party updateParty(@RequestBody @Valid final Party party, HttpServletRequest request) throws Exception {
		ControllerSecurityHelper.checkAdminLevelSecurity(request);
		log.info("ADMIN: Updating PARTY(" + party.getId() + ")");
		return partyService.update(party);
	}

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/{partyId}", method = RequestMethod.DELETE)
	public boolean deleteParty(@PathVariable long partyId, HttpServletRequest request) throws Exception {
		ControllerSecurityHelper.checkAdminLevelSecurity(request);

    	/* real delete needs to delete also all connected data
        partyService.delete(partyId);
        */

    	/*
    	 * just deactiavte for now
    	 */

		Party party = partyService.findById(partyId);
		party.setVisibility(Party.VISIBILITY_DEACTIVATED);
		partyService.update(party);

		return true;
	}

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/{partyId}", method = RequestMethod.GET)
	public Party getParty(@PathVariable long partyId, @RequestParam(value = "lastTS", defaultValue = "0") long lastTs, HttpServletRequest request) throws Exception {

		Party party = partyService.findById(partyId);
		if (party == null) throw new Exception("was not able to load party with id(" + partyId + ") - NOT FOUND");

		// if user/client is set by header -> add requests and notifications important to user
		try {

			Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(request, clientService);

			if (client != null) {

				User user = userService.findById(client.getUserId());
				if (user == null)
					throw new Exception("was not able to load user with id(" + client.getUserId() + ") - NOT FOUND");
				boolean userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), party.getId());
				boolean userIsPartyReviewer = Helper.contains(user.getReviewerOnParties(), party.getId());

				// update activity on user
				if (!user.wasUserActiveInLastMinutes(1)) {
					log.info("Updating ActivityTS of user(" + user.getId() + ")");
					user.setLastActivityTS(System.currentTimeMillis());
					userService.update(user);
				}

				List<Request> requests = requestService.getAllPartyRequests(partyId);
				List<Notification> notifications = notificationService.getAllNotificationsSince(client.getUserId(), partyId, lastTs);
				notificationService.deleteAllNotificationsOlderThan(client.getUserId(), partyId, lastTs); //todo: why??? (tino is asking)
				if (requests == null) requests = new ArrayList<Request>();
				if (notifications == null) notifications = new ArrayList<Notification>();

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

				party.setRequests(new HashSet<Request>(requests));
				party.setNotifications(new HashSet<Notification>(notifications));

				// add accounting info
				final String userAccountName = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), partyId);
				Long userBalance = accountingService.getBalanceOfAccount(userAccountName);
				if (userBalance == null) userBalance = 0l;
				party.setKonfettiCount(userBalance);

				// set how many konfetti can be send id feature is enabled
				if (party.getSendKonfettiMode() == Party.SENDKONFETTIMODE_DISABLED) {
					// is disabled - set to zero
					party.setSendKonfettiMaxAmount(0);
				} else if (party.getSendKonfettiMode() == Party.SENDKONFETTIMODE_ALL) {
					// all konfetti can be spend
					party.setSendKonfettiMaxAmount(party.getKonfettiCount());
				} else if (party.getSendKonfettiMode() == Party.SENDKONFETTIMODE_JUSTEARNED) {
					// just earned konfetti can be spend
					party.setSendKonfettiMaxAmount(this.accountingService.getBalanceEarnedOfAccount(userAccountName));
				} else {
					log.warn("Not implemented KonfettiSendMode of " + party.getSendKonfettiMode());
				}

				party.setKonfettiTotal(-1l); // TODO: implement statistic later
				party.setTopPosition(-1); // TODO: implement statistic later

				// see if there is any new chat message for user TODO: find a more performat way
				List<Chat> allPartyChatsUserIsPartOf = chatService.getAllByUserAndParty(client.getUserId(), partyId);
				for (Chat chat : allPartyChatsUserIsPartOf) {
					if (!chat.hasUserSeenLatestMessage(client.getUserId())) {
						// create temporary notification (a notification that is not in DB)
						Notification noti = new Notification();
						noti.setId(-System.currentTimeMillis());
						noti.setPartyId(partyId);
						noti.setRef(chat.getRequestId());
						noti.setType(NotificationType.CHAT_NEW);
						noti.setUserId(client.getUserId());
						noti.setTimeStamp(System.currentTimeMillis());
						Set<Notification> notis = party.getNotifications();
						notis.add(noti);
						party.setNotifications(notis);
					}
				}
			}

		} catch (Exception e) {
			e.printStackTrace();
			// exception can be ignored - because its just optional
			log.info("Was not able to get optional client info on request for party(" + partyId + "): " + e.getMessage());
		}

		return party;
	}

	@CrossOrigin(origins = "*")
	@RequestMapping(method = RequestMethod.GET)
	public List<Party> getAllParties(
			@RequestParam(value = "lat", defaultValue = "0.0") String latStr,
			@RequestParam(value = "lon", defaultValue = "0.0") String lonStr,
			HttpServletRequest request) throws Exception {

		log.info("getAllParties lat(" + latStr + ") lon(" + lonStr + ")");

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
			log.info("return all parties");

			resultParties = allParties;

		} else {

			// filter parties when in reach of GPS

			double lat = Double.parseDouble(latStr);
			double lon = Double.parseDouble(lonStr);

			log.info("filter parties on lat(" + lat + ") lon(" + lon + ")");

			for (Party party : allParties) {

				// calc distance in meters (and set on object)
				double distanceMetersDouble = Helper.distInMeters(lat, lon, party.getLat(), party.getLon());
				long distanceMetersLong = Math.round(distanceMetersDouble);
				if (distanceMetersLong > Integer.MAX_VALUE) distanceMetersLong = Integer.MAX_VALUE;
				int distanceMeters = (int) distanceMetersLong;

				log.info("party(" + party.getId() + ") with meterrange(" + party.getMeters() + ") has distance to user of meters(" + distanceMeters + ")");

				// check if user GPS is within party area or party is global
				log.warn("TODO: Fix this geo filter later ... now just show every party");
				if ((distanceMeters <= party.getMeters()) || (party.getMeters() == 0)) {

					log.info("--> IN");

					// use meters field to set distance for user perspective
					party.setMeters(distanceMeters);

					// add to result list
					resultParties.add(party);
				} else {

					log.info("--> OUT");

				}

			}

		}

		// try to personalize when client/user info is in header
		try {

			Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(request, clientService);

			if (client != null) {

				// force add parties the user is member of (if not already in list)
				User user = userService.findById(client.getUserId());
				if (user != null) {
					Long[] mustHavePartyIds = user.getActiveOnParties();
					if (mustHavePartyIds.length > 0) {
						// TODO: implement
						log.warn("PartyController getAllParties(): TODO: mustHaveParty to add to partylist");
					}
				}

				// update activity on user
				if (!user.wasUserActiveInLastMinutes(1)) {
					log.info("Updating ActivityTS of user(" + user.getId() + ")");
					user.setLastActivityTS(System.currentTimeMillis());
					userService.update(user);
				}

				// for all parties
				for (final Party party : resultParties) {

					final String accountName = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), party.getId());

					// add accounting info
					Long userBalance = accountingService.getBalanceOfAccount(accountName);

					// if user is new on party (has no account yet)
					if (userBalance == null) {

						userBalance = 0L;

						log.info("New User(" + client.getUserId() + ") active on Party(" + party.getId() + ")");

						// create account
						if (!accountingService.createAccount(accountName)) {
							log.warn("Was not able to create balance account(" + accountName + ")");
						}

						// make user member of party
						Long[] activeParties = user.getActiveOnParties();
						activeParties = Helper.append(activeParties, party.getId());
						user.setActiveOnParties(activeParties);
						userService.update(user);

						// welcome user
						if (party.getWelcomeBalance() > 0) {

							// transfer welcome konfetti
							log.info("Transfer Welcome-Konfetti(" + party.getWelcomeBalance() + ") on Party(" + party.getId() + ") to User(" + client.getUserId() + ") with accountName(" + accountName + ")");

							try {
								userBalance = accountingService.addBalanceToAccount(TransactionType.USER_WELCOME, accountName, party.getWelcomeBalance());
							} catch (Exception e) {
								e.printStackTrace();
							}

						}

						// show welcome notification
						log.info("NOTIFICATION Welcome Paty (" + party.getId() + ")");
						notificationService.create(NotificationType.PARTY_WELCOME, user.getId(), party.getId(), 0l);

						log.debug("userBalance(" + userBalance + ")");

					} else {

						log.debug("user known on party");

					}
					party.setKonfettiCount(userBalance);

					// disable statistics in this level
					party.setKonfettiTotal(-1l);
					party.setTopPosition(-1);

				}

			}

		} catch (Exception e) {
			// exception can be ignored - because its just optional
			log.info("Was not able to get optional client info on request for party list: " + e.getMessage());
		}

		log.info("RESULT number of parties is " + resultParties.size());
		return resultParties;

	}

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/{partyId}/notification/{notiId}", method = RequestMethod.GET)
	public Notification getNotification(@PathVariable long partyId, @PathVariable long notiId, @RequestParam(value = "action", defaultValue = "no") String action, HttpServletRequest httpRequest) throws Exception {

		log.info("PartyController getNotification(" + notiId + ") action(" + action + ") ...");

		// get notification
		Notification noti = notificationService.findById(notiId);
		if (noti == null) throw new Exception("notification(" + notiId + ") not found");

		// check if user is allowed to work on notification
		if (httpRequest.getHeader("X-CLIENT-ID") != null) {

			// A) check if user is owner of notification
			Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
			boolean userIsOwner = (noti.getUserId().equals(client.getUserId()));
			if (!userIsOwner)
				throw new Exception("cannot action notification(" + notiId + ") - user is not noti owner / client.userID(" + client.getUserId() + ") != notiUserId(" + noti.getUserId() + ")");

		} else {

			// B) check for trusted application with administrator privilege
			ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
		}

    	/*
    	 * Action
    	 */

		if (action.equals("delete")) {
			if (notiId >= 0l) {
				notificationService.delete(notiId);
				log.info("Notification(" + notiId + ") DELETED");
			} else {
				log.warn("Client should not try to delete temporaray notifications with id<0");
			}

		}

		return noti;
	}

	//---------------------------------------------------
	// NOTIFICATION Controller
	//---------------------------------------------------

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/{partyId}/{langCode}/request", method = RequestMethod.POST)
	public Request createRequest(@PathVariable long partyId, @PathVariable String langCode, @RequestBody @Valid final Request request, HttpServletRequest httpRequest) throws Exception {

		// load party for background info
		Party party = partyService.findById(partyId);
		if (party == null) throw new Exception("party with id(" + partyId + ") not found");

		// get user info
		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
		if (client == null) throw new Exception("client not found");
		User user = userService.findById(client.getUserId());
		if (user == null) throw new Exception("user(" + client.getUserId() + ") not found");

		// check if request has minimal konfetti
		if (request.getKonfettiCount() < 0) throw new Exception("invalid konfetti on request");
		if (request.getKonfettiCount() < party.getNewRequestMinKonfetti())
			throw new Exception("not enough konfetti on request - is(" + request.getKonfettiAdd() + ") needed(" + party.getNewRequestMinKonfetti() + ")");

		// check if user has minimal konfetti
		Long userBalance = accountingService.getBalanceOfAccount(AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), party.getId()));
		if (userBalance == null) userBalance = 0l;
		if (userBalance < request.getKonfettiCount())
			throw new Exception("not enough konfetti on userbalance - is(" + userBalance + ") needed(" + request.getKonfettiCount() + ")");

		// write data better set by server
		request.setTime(System.currentTimeMillis());
		request.setUserId(client.getUserId());
		request.setPartyId(partyId);

		// set state based on party settings
		if (party.getReviewLevel() == Party.REVIEWLEVEL_NONE) {
			request.setState(Request.STATE_OPEN);
		} else {
			request.setState(Request.STATE_REVIEW);
			// TODO push info to review admin
			if (user.getPushActive()) log.warn("TODO: push info to review admin");
		}

		// update fields in user and persist
		user.setImageMediaID(request.getImageMediaID());
		user.setName(request.getUserName());
		user.setSpokenLangs(request.getSpokenLangs());
		userService.update(user);

		// title --> multi language
		MultiLang multiLang = AutoTranslator.getInstance().translate(langCode, request.getTitle());
		String json = new ObjectMapper().writeValueAsString(multiLang);
		log.info("request title --autotranslate--> " + json);
		MediaItem mediaItem = new MediaItem();
		mediaItem.setData(json);
		mediaItem.setLastUpdateTS(System.currentTimeMillis());
		mediaItem.setReviewed(MediaItem.REVIEWED_PUBLIC);
		mediaItem.setType(MediaItem.TYPE_MULTILANG);
		mediaItem.setUserId(client.getUserId());
		mediaItem = mediaService.create(mediaItem);
		log.info("multilang stored with id(" + mediaItem.getId() + ")");
		request.setTitleMultiLangRef(mediaItem.getId());

		// check media items on new request
		if (request.getMediaItemIds().length > 0) {
			Long[] mediaItemIds = request.getMediaItemIds();
			for (int i = 0; i < mediaItemIds.length; i++) {
				Long mediaItemId = mediaItemIds[i];
				MediaItem item = mediaService.findById(mediaItemId);
				if (item==null) {
					request.setMediaItemIds(null);
					log.error("new request has non existing media items on it - security clearing all mediaitems on request");
					break;
				}
				if (!item.getUserId().equals(client.getUserId())) {
					request.setMediaItemIds(null);
					log.error("new request has media items other users on it - security clearing all mediaitems on request");
					break;
				}
			}
		}

		// create request
		Request persistent = requestService.create(request);

		// transfer balance to request account
		accountingService.createAccount(AccountingTools.getAccountNameFromRequest(persistent.getId()));
		if (request.getKonfettiCount() > 0) {
			accountingService.transferBetweenAccounts(TransactionType.TASK_CREATION, AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), partyId), AccountingTools.getAccountNameFromRequest(persistent.getId()), request.getKonfettiCount());
		}

		// store notification
		notificationService.create(REVIEW_WAITING, null, party.getId(), request.getId());

		// publish info about update on public channel
		CommandMessage msg = new CommandMessage();
		msg.setCommand(CommandMessage.COMMAND_PARTYUPADTE);
		msg.setData("{\"party\":" + persistent.getPartyId() + ", \"request\":" + persistent.getId() + " ,\"state\":\"" + persistent.getState() + "\"}");
		webSocket.convertAndSend("/out/updates", GSON.toJson(msg));

		return persistent;
	}

	//---------------------------------------------------
	// REQUEST Controller
	//---------------------------------------------------

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
		if (request == null) throw new Exception("no request with id(" + requestId + ") found");

		// check if user is allowed to delete
		if (httpRequest.getHeader("X-CLIENT-ID") != null) {

			// A) client for user (party admin or reeuest author)

			Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
			User user = userService.findById(client.getUserId());

			boolean userIsAuthor = (request.getUserId().equals(client.getUserId()));
			boolean userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), request.getPartyId());
			log.info("delete request(" + requestId + ") ... client is author(" + userIsAuthor + ") partyAdmin(" + userIsPartyAdmin + ")");

			if ((!userIsAuthor) && (!userIsPartyAdmin))
				throw new Exception("cannot delete request(" + requestId + ") - user is not request author or party admin");

		} else {

			// B) check for trusted application with administrator privilege

			ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
		}

		// delete any waiting notification finding a reviewer
		if (Request.STATE_REVIEW.equals(request.getState()))
			notificationService.deleteByTypeAndReference(REVIEW_WAITING, request.getId());

		// delete
		Request result = requestService.delete(request.getId());

		// payback of upvote konfetti when request is still open
		if (!Request.STATE_DONE.equals(request.getState())) {
			List<KonfettiTransaction> allPayIns = konfettiTransactionService.getAllTransactionsToAccount(AccountingTools.getAccountNameFromRequest(requestId));
			for (KonfettiTransaction payIn : allPayIns) {
				if ((payIn.getType() == TransactionType.TASK_SUPPORT) && (!AccountingTools.getAccountNameFromUserAndParty(request.getUserId(), request.getPartyId()).equals(payIn.getFromAccount()))) {
					// make payback
					accountingService.transferBetweenAccounts(TransactionType.TASK_SUPPORT, AccountingTools.getAccountNameFromRequest(requestId), payIn.getFromAccount(), payIn.getAmount());
					notificationService.create(PAYBACK, AccountingTools.getUserIdFromAccountName(payIn.getFromAccount()), AccountingTools.getPartyIdFromAccountName(payIn.getFromAccount()), payIn.getAmount());
				}
			}
		}

		return result;
	}

	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/{partyId}/request/{requestId}", method = RequestMethod.GET)
	public Request getRequest(@PathVariable long partyId, @PathVariable long requestId, @RequestParam(value = "upvoteAmount", defaultValue = "0") Long upvoteAmount, HttpServletRequest httpRequest) throws Exception {

		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
		log.info("PartyController getRequest(" + requestId + ") upvoteAmount(" + upvoteAmount + ") ...");

		Request request = requestService.findById(requestId);
		if (request != null) {

			User user = userService.findById(client.getUserId());
			boolean userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), request.getPartyId());

			// add chats to request (when user is host or member)
			List<Chat> chats = this.chatService.getAllByRequestId(request.getId());
			if (chats == null) chats = new ArrayList<Chat>();
			List<Chat> relevantChats = new ArrayList<Chat>();
			for (Chat chat : chats) {
				if (!chat.chatContainsMessages()) continue;
				if (chat.getHostId().equals(client.getUserId())) {
					chat = ChatController.setChatPartnerInfoOn(userService, chat, chat.getMembers()[0], client.getUserId());
					relevantChats.add(chat);
				} else if (Helper.contains(chat.getMembers(), client.getUserId())) {
					chat = ChatController.setChatPartnerInfoOn(userService, chat, chat.getHostId(), client.getUserId());
					relevantChats.add(chat);
				} else if (userIsPartyAdmin) {
					chat = ChatController.setChatPartnerInfoOn(userService, chat, chat.getMembers()[0], client.getUserId());
					relevantChats.add(chat);
				}
			}
			request.setChats(relevantChats);

			// add media items to request
			List<MediaItem> infos = null;
			if (infos == null) infos = new ArrayList<MediaItem>();
			Long[] mediaIDs = request.getMediaItemIds();
			if ((mediaIDs != null) && (mediaIDs.length > 0)) {
				for (int i = 0; i < mediaIDs.length; i++) {
					MediaItem item = mediaService.findById(mediaIDs[i]);
					infos.add(item);
				}
			}
			request.setInfo(infos);


			// add info about support to the request from this user
			long konfettiAmountSupport = 0l;
			List<KonfettiTransaction> allTransactionsToRequest = konfettiTransactionService.getAllTransactionsToAccountSinceTS(AccountingTools.getAccountNameFromRequest(request.getId()), request.getTime());
			for (KonfettiTransaction konfettiTransaction : allTransactionsToRequest) {
				if (AccountingTools.getUserIdFromAccountName(konfettiTransaction.getFromAccount()).equals(user.getId())) {
					konfettiAmountSupport += konfettiTransaction.getAmount();
				}
			}
			request.setKonfettiAmountSupport(konfettiAmountSupport);

			// add info about rewards from the request to user
			long konfettiAmountReward = 0l;
			if (request.getState().equals(Request.STATE_DONE)) {
				String accountName = AccountingTools.getAccountNameFromRequest(request.getId());
				List<KonfettiTransaction> allTransactionsFromRequest = konfettiTransactionService.getAllTransactionsFromAccountSinceTS(accountName, request.getTime());
				for (KonfettiTransaction konfettiTransaction : allTransactionsFromRequest) {
					if (konfettiTransaction.getType() != TransactionType.TASK_REWARD) continue;
					if (konfettiTransaction.getFromAccount() == null) {
						log.warn("NULL fromAdress on transaction(" + konfettiTransaction.getId() + ") on request(" + request.getId() + ") ... why?!?");
						continue;
					}
					if (user.getId().equals(AccountingTools.getUserIdFromAccountName(konfettiTransaction.getToAccount()))) {
						konfettiAmountReward += konfettiTransaction.getAmount();
					}
				}
			}
			request.setKonfettiAmountReward(konfettiAmountReward);

			// UPVOTE (optional when request parameter set)
			if (upvoteAmount > 0l) {

				log.info("Upvoting request(" + requestId + ") with amount(" + upvoteAmount + ") ...");

				// check if user has enough balance
				String userAccountname = AccountingTools.getAccountNameFromUserAndParty(client.getUserId(), partyId);
				Long userBalance = accountingService.getBalanceOfAccount(userAccountname);
				if (userBalance == null)
					throw new Exception("not able to get account balance of account(" + userAccountname + ")");
				if (userBalance < upvoteAmount)
					throw new Exception("user(" + client.getId() + ") has not enough balance to upvote on party(" + partyId + ") - is(" + userBalance + ") needed(" + upvoteAmount + ")");

				// transfer amount
				if (!accountingService.transferBetweenAccounts(TransactionType.TASK_SUPPORT, userAccountname, AccountingTools.getAccountNameFromRequest(requestId), upvoteAmount)) {
					throw new Exception("was not able to transfer upvote amount(" + upvoteAmount + ") from(" + userAccountname + ") to(" + AccountingTools.getAccountNameFromRequest(requestId) + ")");
				}

				log.info("... OK: transfer of upvote amount(" + upvoteAmount + ") from(" + userAccountname + ") to(" + AccountingTools.getAccountNameFromRequest(requestId) + ") done.");

			} else {

				log.info("no Upvoting - amount(" + upvoteAmount + ")");

			}

			// add account balance to request object
			request.setKonfettiCount(accountingService.getBalanceOfAccount(AccountingTools.getAccountNameFromRequest(requestId)));

			// publish info about update on public channel
			CommandMessage msg = new CommandMessage();
			msg.setCommand(CommandMessage.COMMAND_PARTYUPADTE);
			msg.setData("{\"party\":" + request.getPartyId() + ", \"request\":" + request.getId() + " ,\"state\":\"" + request.getState() + "\", \"konfetti\":" + request.getKonfettiCount() + "}");
			webSocket.convertAndSend("/out/updates", GSON.toJson(msg));

		} else {
			log.warn("PartyController getRequest(" + requestId + ") --> NULL");
		}

		return request;
	}

	@SuppressWarnings("unchecked")
	@CrossOrigin(origins = "*")
	@RequestMapping(value = "/action/request/{requestId}", method = RequestMethod.GET)
	public Request actionRequest(@PathVariable long requestId, @RequestParam(value = "action", defaultValue = "no") String action, @RequestParam(value = "json", defaultValue = "") String json, HttpServletRequest httpRequest) throws Exception {

		Request request = requestService.findById(requestId);
		if (request != null) {

			if (action.equals("no")) throw new Exception("missing parameter action");

			// check if user is allowed to work on request
			boolean userIsAuthor = false;
			boolean userIsPartyAdmin = false;
			boolean userIsPartyReviewer = false;
			if (httpRequest.getHeader("X-CLIENT-ID") != null) {

				// A) client for user (party admin, reviewer or request author)

				Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
				User user = userService.findById(client.getUserId());

				userIsAuthor = (request.getUserId().equals(client.getUserId()));
				userIsPartyAdmin = Helper.contains(user.getAdminOnParties(), request.getPartyId());
				userIsPartyReviewer = Helper.contains(user.getReviewerOnParties(), request.getPartyId());
				log.info("action request(" + requestId + ") ... client is author(" + userIsAuthor + ") partyAdmin(" + userIsPartyAdmin + ") partyReview(" + userIsPartyReviewer + ")");

				if ((!userIsAuthor) && (!userIsPartyAdmin) && (!userIsPartyReviewer))
					throw new Exception("cannot action request(" + requestId + ") - user is not request author or party admin or reviewer");

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
				boolean fromReview = request.getState().equals(Request.STATE_REVIEW);
				boolean fromProcessing = request.getState().equals(Request.STATE_PROCESSING);
				if ((!fromReview) && (!fromProcessing))
					throw new Exception("request(" + requestId + ") with state(" + request.getState() + ") CANNOT set to '" + Request.STATE_OPEN + "'");

				// check if admin or reviewer
				if ((!userIsPartyAdmin) && (!userIsPartyReviewer)) {
					// if is author unpausing an request
					if ((!userIsAuthor) || (!request.getState().equals(Request.STATE_PROCESSING)))
						throw new Exception("request(" + requestId + ") author cannot set to open");
				}

				// set open & persists
				request.setState(Request.STATE_OPEN);
				requestService.update(request);
				log.info("request(" + requestId + ") set STATE to " + Request.STATE_OPEN);


				if (fromReview) {

					// send notification to author
					notificationService.create(NotificationType.REVIEW_OK, request.getUserId(), request.getPartyId(), request.getId());

					// delete any waiting notification finding a reviewer
					notificationService.deleteByTypeAndReference(REVIEW_WAITING, request.getId());
				}

				// publish info about update on public channel
				CommandMessage msg = new CommandMessage();
				msg.setCommand(CommandMessage.COMMAND_PARTYUPADTE);
				msg.setData("{\"party\":" + request.getPartyId() + ", \"request\":" + request.getId() + " ,\"state\":\"" + request.getState() + "\"}");
				webSocket.convertAndSend("/out/updates", GSON.toJson(msg));

			} else

				// set processing (by all)
				if (action.equals(Request.STATE_PROCESSING)) {

					// check if pre-state is valid
					if (!request.getState().equals(Request.STATE_OPEN))
						throw new Exception("request(" + requestId + ") with state(" + request.getState() + ") CANNOT set to '" + Request.STATE_PROCESSING + "'");

					// set processing & persists
					request.setState(Request.STATE_PROCESSING);
					requestService.update(request);
					log.info("request(" + requestId + ") set STATE to " + Request.STATE_PROCESSING);

				} else

					// set rejected (by admin and reviewer)
					if (action.equals(Request.STATE_REJECTED)) {

						// check if admin or reviewer
						if ((!userIsPartyAdmin) && (!userIsPartyReviewer))
							throw new Exception("request(" + requestId + ") author cannot set to rejected");

						// set processing & persists
						request.setState(Request.STATE_REJECTED);
						requestService.update(request);
						log.info("request(" + requestId + ") set STATE to " + Request.STATE_REJECTED);

						// publish info about update on public channel
						CommandMessage msg = new CommandMessage();
						msg.setCommand(CommandMessage.COMMAND_PARTYUPADTE);
						msg.setData("{\"party\":" + request.getPartyId() + ", \"request\":" + request.getId() + " ,\"state\":\"" + request.getState() + "\"}");
						webSocket.convertAndSend("/out/updates", GSON.toJson(msg));

						// delete any waiting notification finding a reviewer
						notificationService.deleteByTypeAndReference(REVIEW_WAITING, request.getId());

						// send notification to author
						notificationService.create(REVIEW_FAIL, request.getUserId(), request.getPartyId(), request.getId());

					} else

						// do reward
						if (action.equals("reward")) {

							// needed json data
							if ((json == null) || (json.length() == 0)) throw new Exception("minning parameter json");
							List<Long> ids = new ArrayList<Long>();
							try {
								List<Integer> idsInts = (new ObjectMapper()).readValue(json, ids.getClass());
								int nInts = idsInts.size();
								for (int i = 0; i < nInts; ++i) {
									ids.add(idsInts.get(i).longValue());
								}
							} catch (Exception e) {
								e.printStackTrace();
								throw new Exception("json paramter not valid");
							}
							if (ids.isEmpty()) throw new Exception("json(" + json + ") is empty list if ids");
							if (ids.get(0) == null)
								throw new Exception("json(" + json + ") contains just NULL and no list if ids");

							// check if admin or reviewer
							if ((!userIsPartyAdmin) && (!userIsAuthor))
								throw new Exception("request(" + requestId + ") author cannot set to rejected");

							// TODO: check if ids have chats on request

							// get reward balance
							final String requestAccountName = AccountingTools.getAccountNameFromRequest(request.getId());
							Long requestBalance = accountingService.getBalanceOfAccount(requestAccountName);
							if ((requestBalance < ids.size()) && (requestBalance > 0))
								throw new Exception("there are more rewardees than reward - not possible");

							// split reward
							Long rewardPerPerson = 0l;
							if (requestBalance > 0) {

								rewardPerPerson = (long) Math.floor((requestBalance * 1d) / (ids.size() * 1d));
								if (((rewardPerPerson * ids.size()) > requestBalance) || (rewardPerPerson <= 0))
									throw new Exception("reward(" + requestBalance + ") is not splitting up correctly to " + ids.size() + " --> " + rewardPerPerson);

								// transfer reward to users
								for (Long rewardId : ids) {
									log.info("making transfere reward to userId(" + rewardId + ") ...");
									if (rewardId == null) {
										log.warn("skipping a NULL rewardId");
										continue;
									}
									if (rewardId.equals(request.getUserId())) {
										log.warn("ignoring the author self-rewrad");
										continue;
									}
									final String rewardeeAccountName = AccountingTools.getAccountNameFromUserAndParty(rewardId, request.getPartyId());
									if (!accountingService.transferBetweenAccounts(TransactionType.TASK_REWARD, requestAccountName, rewardeeAccountName, rewardPerPerson)) {
										log.error("FAIL payout reward(" + rewardPerPerson + ") from(" + requestAccountName + ") to " + rewardeeAccountName);
									} else {
										log.info("OK payout reward(" + rewardPerPerson + ") from(" + requestAccountName + ") to " + rewardeeAccountName);
										// send notification to author
										notificationService.create(REWARD_GOT, rewardId, request.getPartyId(), request.getId());
									}
								}

								// notification to all supporters of request about finish
								List<KonfettiTransaction> allPayIns = konfettiTransactionService.getAllTransactionsToAccount(AccountingTools.getAccountNameFromRequest(requestId));
								for (KonfettiTransaction payIn : allPayIns) {
									if ((payIn.getType() == TransactionType.TASK_SUPPORT) && (!AccountingTools.getAccountNameFromUserAndParty(request.getUserId(), request.getPartyId()).equals(payIn.getFromAccount()))) {
										notificationService.create(SUPPORT_WIN, AccountingTools.getUserIdFromAccountName(payIn.getFromAccount()), AccountingTools.getPartyIdFromAccountName(payIn.getFromAccount()), request.getId());
									}
								}

							}

							// set processing & persists
							request.setState(Request.STATE_DONE);
							requestService.update(request);
							log.info("request(" + requestId + ") set STATE to " + Request.STATE_DONE);

							// publish info about update on public channel
							CommandMessage msg = new CommandMessage();
							msg.setCommand(CommandMessage.COMMAND_PARTYUPADTE);
							msg.setData("{\"party\":" + request.getPartyId() + ", \"request\":" + request.getId() + " ,\"state\":\"" + request.getState() + "\"}");
							webSocket.convertAndSend("/out/updates", GSON.toJson(msg));

						} else


							// mute chat on request
							if (action.equals("muteChat")) {

								// needed json data
								if ((json == null) || (json.length() == 0))
									throw new Exception("minning parameter json");
								Long chatId = 0l;
								try {
									chatId = (new ObjectMapper()).readValue(json, chatId.getClass());
								} catch (Exception e) {
									e.printStackTrace();
									throw new Exception("json paramter not valid");
								}

								// try load chat
								Chat chat = chatService.findById(chatId);
								if (chat == null) throw new Exception("chat(" + chatId + ") not found");
								if (!chat.getRequestId().equals(request.getId()))
									throw new Exception("chat(" + chatId + ") not on request(" + requestId + ")");

								// check if admin or author
								if ((!userIsPartyAdmin) && (!userIsAuthor))
									throw new Exception("request(" + requestId + ") not allowed to mute chat(" + chatId + ")");

								// mut chat & persists
								chat.setMuted(true);
								chatService.update(chat);
								log.info("chat(" + chatId + ") on request(" + requestId + ") muted ");

								// TODO Implement send notification to muted chat user or add info as chat message
								log.warn("TODO: Implement send notification to muted chat user or add info as chat message");

							} else

								// delete media item from request
								if (action.equals("deleteMedia")) {

									// needed json data --> the id of the media item to add
									if ((json == null) || (json.length() == 0))
										throw new Exception("missing parameter json");
									Long mediaId = 0l;
									try {
										mediaId = (new ObjectMapper()).readValue(json, mediaId.getClass());
									} catch (Exception e) {
										e.printStackTrace();
										throw new Exception("json paramter not valid");
									}

									// check if media item exists
									MediaItem item = mediaService.findById(mediaId);
									if (item == null) throw new Exception("media(" + mediaId + ") not found");

									// check if admin or author
									if ((!userIsPartyAdmin) && (!userIsAuthor) && (!userIsPartyReviewer))
										throw new Exception("request(" + requestId + ") not allowed to remove media(" + mediaId + ")");

									// remove media
									request.setMediaItemIds(Helper.remove(request.getMediaItemIds(), new Long(mediaId)));
									requestService.update(request);
									log.info("mediaItem(" + mediaId + ") removed from request(" + requestId + ")");

								} else

									// add media item to request
									if (action.equals("addMedia")) {

										// needed json data --> the id of the media item to add
										if ((json == null) || (json.length() == 0))
											throw new Exception("missing parameter json");
										Long mediaId = 0l;
										try {
											mediaId = (new ObjectMapper()).readValue(json, mediaId.getClass());
										} catch (Exception e) {
											e.printStackTrace();
											throw new Exception("json paramter not valid");
										}

										// check if media item exists
										MediaItem item = mediaService.findById(mediaId);
										if (item == null) throw new Exception("media(" + mediaId + ") not found");

										// check if admin or author
										if ((!userIsPartyAdmin) && (!userIsAuthor))
											throw new Exception("request(" + requestId + ") not allowed to ad media(" + mediaId + ")");

										// add media to request
										Long[] itemIds = request.getMediaItemIds();
										itemIds = Helper.append(itemIds, mediaId);
										request.setMediaItemIds(itemIds);
										requestService.update(request);
										log.info("mediaItem(" + mediaId + ") add to request(" + requestId + ")");

										// TODO Implement send notification to reviewer if media item still needs review
										log.warn("TODO: Implement send notification to reviewer if media item still needs review");

									} else


										// make a media item public (set as reviewed)
										if (action.equals("publicMedia")) {

											// needed json data --> the id of the media item to add
											if ((json == null) || (json.length() == 0))
												throw new Exception("missing parameter json");
											Long mediaId = 0l;
											try {
												mediaId = (new ObjectMapper()).readValue(json, mediaId.getClass());
											} catch (Exception e) {
												e.printStackTrace();
												throw new Exception("json paramter not valid");
											}

											// check if media item exists
											MediaItem item = mediaService.findById(mediaId);
											if (item == null) throw new Exception("media(" + mediaId + ") not found");

											// check if request contains this media item
											if (!Helper.contains(request.getMediaItemIds(), mediaId))
												throw new Exception("mediaItem(" + mediaId + ") is not part of request(" + requestId + ")");

											// check if admin or reviewer
											if ((!userIsPartyAdmin) && (!userIsPartyReviewer))
												throw new Exception("request(" + requestId + ") not allowed to remove media(" + mediaId + ")");

											// set media public
											item.setReviewed(MediaItem.REVIEWED_PUBLIC);
											mediaService.update(item);
											log.info("mediaItem(" + mediaId + ") is now public");

										} else

										// unkown action
										{
											throw new Exception("unkown action(" + action + ") on request(" + requestId + ")");
										}


		} else {
			log.warn("PartyController getRequest(" + requestId + ") --> NULL");
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

	public class DashBoardInfo {
		public Long numberOfKonfetti = -1l;
		public Long numberOfUsers = -1l;
		public Long numberOfTasks = -1l;
		public Long numberOfParties = -1l;
	}

}
