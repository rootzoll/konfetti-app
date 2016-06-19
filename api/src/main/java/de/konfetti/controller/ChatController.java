package de.konfetti.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.konfetti.data.*;
import de.konfetti.service.*;
import de.konfetti.utils.PushManager;
import de.konfetti.websocket.CommandMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.*;

@Slf4j
@CrossOrigin
@RestController
@RequestMapping("konfetti/api/chat")
public class ChatController {

	private static final Gson GSON = new GsonBuilder().create();

    private final UserService userService;
    private final ClientService clientService;
    private final ChatService chatService;
    private final MessageService messageService;
    private final RequestService requestService;
    
    @Autowired
    private SimpMessagingTemplate webSocket;

    @Autowired
    public ChatController(final UserService userService, final ClientService clientService, final ChatService chatService, final MessageService messageService, final RequestService requestService) {
        this.userService = userService;
        this.clientService = clientService;
        this.chatService = chatService;
        this.messageService = messageService;
        this.requestService = requestService;
    }

    //---------------------------------------------------
    // CHAT Controller
    //---------------------------------------------------

	public static Chat setChatPartnerInfoOn(UserService userService, Chat chat, Long chatPartnerUserId, Long selfId) {
		User user = userService.findById(chatPartnerUserId);
		if (user == null) {
			log.warn("Cannot set ChatPartnerInfo for user(" + chatPartnerUserId + ") - NOT FOUND");
			return chat;
		}
		chat.setChatPartnerId(user.getId());
		chat.setChatPartnerName(user.getName());
		if ((user.getImageMediaID() != null) && (user.getImageMediaID() > 0))
			chat.setChatPartnerImageMediaID(user.getImageMediaID());
		if ((user.getSpokenLangs() != null) && (user.getSpokenLangs().length > 0))
			chat.setChatPartnerSpokenLangs(user.getSpokenLangs());
		chat.setUnreadMessage(!chat.hasUserSeenLatestMessage(selfId));
		return chat;
	}

	@CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST, produces = "application/json")
    public Chat createChat(@RequestBody @Valid final Chat template, HttpServletRequest httpRequest) throws Exception {

    	// check if user is allowed to create
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {

    		// A) check that chat is just hosted by user
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsHost = (template.getHostId().equals(client.getUserId()));
    		if (!userIsHost) throw new Exception("user cannot create chat for other users");

        	// B) check if request is set and and set correct party id from request
        	if (template.getRequestId()==null) throw new Exception("request reference is not set");
        	Request request = requestService.findById(template.getRequestId());
        	if (request==null) throw new Exception("request("+template.getRequestId()+") not found");
        	template.setPartyId(request.getPartyId());

        	// C) check if request is open for chats (not done or processing)
        	if (Request.STATE_DONE.equals(request.getState())) throw new Exception("no chat possible on DONE request");
        	if (Request.STATE_PROCESSING.equals(request.getState())) throw new Exception("no chat possible on PROCESSING request");

    	} else {

    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}

    	// security override on template
    	template.setId(null);
    	template.setMessages(new ArrayList<Message>());
    	template.setMuted(false);

    	// check if all members exist
    	for (Long memberId : template.getMembers()) {
			User memberUser = userService.findById(memberId);
			if (memberUser==null) throw new Exception("member("+memberId+") on new chat does NOT EXIST");
		}

    	// create new user
    	Chat chat = chatService.create(template);

		// add transient chat partner info
		if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		if (chat.getMembers().length==1) {
				setChatPartnerInfoOn(userService, chat, chat.getMembers()[0], 0l);
			} else {
				log.warn("Cannot set ChatPartnerInfo on chats with more than one member.");
			}
    	}

        return chat;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}", method = RequestMethod.GET, produces = "application/json")
    public Chat getChat(@PathVariable Long chatId, @RequestParam(value="lastTS",defaultValue="0") Long lastTS, HttpServletRequest httpRequest) throws Exception {

    	// try to load message and chat
    	Chat chat = chatService.findById(chatId);
    	if (chat==null) throw new Exception("chat("+chatId+") not found");

    	// load messages of chat
    	List<Message> messages = messageService.getAllMessagesOfChatSince(chat.getId(),lastTS);
    	chat.setMessages(messages);

    	// check if user is allowed to get data
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {

			// A) check that user is host or member of chat
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsHost = (chat.getHostId().equals(client.getUserId()));
    		boolean userIsMember = false;
    		for (Long memeberId : chat.getMembers()) {
				if (client.getUserId().equals(memeberId)) {
					userIsMember = true;
					break;
				}
			}
    		if ((!userIsHost) && (!userIsMember)) throw new Exception("not host or member on chat("+chatId+")");

			// B) find biggest message TS of delivered messages and remember
        	long biggestTS = 0l;
        	for (Message message : messages) {
    			if (message.getTime()>biggestTS) biggestTS = message.getTime();
    		}
        	if (biggestTS>chat.getLastTSforMember(client.getUserId())) {
        		chat.setLastTSforMember(client.getUserId(), biggestTS);
        		chatService.update(chat);
        	}

			// C) add transient chat partner info
    		if (userIsHost) {
    			// show member as chat partner
    			if (chat.getMembers().length==1) {
    				setChatPartnerInfoOn(userService, chat, chat.getMembers()[0], client.getUserId());
    			} else {
					log.warn("Cannot set ChatPartnerInfo on chats with more than one member.");
				}
    		} else {
    			// show host as chat partner
    			setChatPartnerInfoOn(userService, chat, chat.getHostId(), client.getUserId());
    		}

		} else {

			// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}

		return chat;
    }
    
    //---------------------------------------------------
    // MESSAGE Controller
    //---------------------------------------------------

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}/message", method = RequestMethod.POST, produces = "application/json")
    public Message addMessage(@PathVariable Long chatId, @RequestBody @Valid final Message template, HttpServletRequest httpRequest) throws Exception {
    	
    	Set<Long> receivers = null;
    	long messageTS = System.currentTimeMillis();
    	
    	Chat chat = chatService.findById(chatId);
    	if (chat==null) throw new Exception("chat("+chatId+") not found");
    	
    	// check if user is allowed to create
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that user is host or member of chat
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsHost = (chat.getHostId().equals(client.getUserId()));
    		boolean userIsMember = false;
    		for (Long memeberId : chat.getMembers()) {
				if (client.getUserId().equals(memeberId)) {
					userIsMember = true;
					break;
				}
			}
    		if ((!userIsHost) && (!userIsMember)) throw new Exception("not host or member on chat("+chatId+")");
    	
    		// make sure userId is correct
        	template.setUserId(client.getUserId());
        	
        	// B) set last TS for posting user to this message TS
        	long lastTSofUser = chat.getLastTSforMember(client.getUserId());
        	if (lastTSofUser<messageTS) {
        		chat.setLastTSforMember(client.getUserId(), messageTS);
        		chatService.update(chat);
        	} else {
				log.warn("strange: messageTS <= lastTSofUser");
			}
        	
        	// C) prepare list of receivers of this message
    		receivers = new HashSet<Long>();
    		receivers.addAll(Arrays.asList(chat.getMembers()));
    		receivers.add(chat.getHostId());
    		receivers.remove(client.getUserId());
    		
    	} else {
    		
    		// A) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	// security override on template
    	template.setId(null);
    	template.setTime(messageTS);
    	template.setChatId(chat.getId());
    	    	
    	// TODOD check that itemId exists
    	
    	// create new user
    	Message message = messageService.create(template);
		log.info("Message(" + message.getId() + ") CREATED on chat(" + chatId + ")");


		// publish info about new chat message public channel
    	CommandMessage msg = new CommandMessage();
    	msg.setCommand(CommandMessage.COMMAND_CHATUPADTE);
    	String jsonArray = "[";
    	for (Long memberID : chat.getMembers()) {
    		jsonArray += (memberID + ",");
		}
		jsonArray += (chat.getHostId() + "]");
    	msg.setData("{\"party\":"+chat.getPartyId()+", \"users\":"+jsonArray+"}");
    	webSocket.convertAndSend("/out/updates", GSON.toJson(msg));  
    	
    	// send push notification if possible
    	if (PushManager.getInstance().isAvaliable()) {
			log.info("PushMessage Alert");
			if (receivers!=null) {
    			for (Long userID : receivers) {
					log.info("PUSHTO(" + userID + ")");
					User receiver = userService.findById(userID);
    				if (receiver!=null) {
    					if (receiver.getPushActive()) {
							log.info(" - WIN - DOING PUSH ...");

							// TODO multi lang - see user
    	    				PushManager.getInstance().sendNotification(
    	    						PushManager.PLATFORM_ANDROID, 
    	    						receiver.getPushID(), 
    	    						"new chat message for you", 
    	    						null, //locale, 
    	    						null, //messageLocale, 
    	    						-1l);
							log.info(" - PUSH DONE :D");

						} else {
							log.info(" - FAIL - NO PUSH");
						}
    				} else {
						log.warn("PUSH RECEIVER id(" + userID + ") NOT FOUND");
					}
				}
    		} else {
				log.info("No Receivers on chat ?!? - no push");
			}
     	} else {
			log.info("PushMessage not configured");
		}
    	
        return message;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}/message/{messageId}", method = RequestMethod.GET, produces = "application/json")
    public Message actionMessage(@PathVariable Long chatId, @PathVariable Long messageId, HttpServletRequest httpRequest) throws Exception {
        
    	// try to load message and chat
    	Chat chat = chatService.findById(chatId);
    	if (chat==null) throw new Exception("chat("+chatId+") not found");
    	Message message = messageService.findById(messageId);
    	if (message==null) throw new Exception("message("+messageId+") not found");
    
    	// check if user is allowed to create
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that user is host or member of chat
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsHost = (chat.getHostId().equals(client.getUserId()));
    		boolean userIsMember = false;
    		for (Long memeberId : chat.getMembers()) {
				if (client.getUserId().equals(memeberId)) {
					userIsMember = true;
					break;
				}
			}
    		if ((!userIsHost) && (!userIsMember)) throw new Exception("not host or member on chat("+chatId+")");
    
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	return message;
    }
    
	
}
