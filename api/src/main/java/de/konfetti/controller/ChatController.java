package de.konfetti.controller;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import de.konfetti.data.Chat;
import de.konfetti.data.Client;
import de.konfetti.data.Message;
import de.konfetti.data.User;
import de.konfetti.service.ChatService;
import de.konfetti.service.ClientService;
import de.konfetti.service.MessageService;
import de.konfetti.service.UserService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin
@RestController
@RequestMapping("konfetti/api/chat")
public class ChatController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatController.class);
	
    private final UserService userService;
    private final ClientService clientService;
    private final ChatService chatService;
    private final MessageService messageService;

    @Autowired
    public ChatController(final UserService userService, final ClientService clientService, final ChatService chatService, final MessageService messageService) {
        this.userService = userService;
        this.clientService = clientService;
        this.chatService = chatService;
        this.messageService = messageService;
    }

    //---------------------------------------------------
    // CHAT Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST, produces = "application/json")
    public Chat createChat(@RequestBody @Valid final Chat template, HttpServletRequest httpRequest) throws Exception {
    	
    	// check if user is allowed to create
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that chat is just hosted by user
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		boolean userIsHost = (template.getHostId().equals(client.getUserId()));
    		if (!userIsHost) throw new Exception("user cannot create chat for other users");
    	
        	// check if request is set
        	if (template.getRequestId()==null) throw new Exception("request reference is not set");
    		
        	// TODO: check if request is open for chats (not done or processing)
        	
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
				setChatPartnerInfoOn(userService, chat, chat.getMembers()[0]);
			} else {
				LOGGER.warn("Cannot set ChatPartnerInfo on chats with more than one member.");
			}
    	}
    
        return chat;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}", method = RequestMethod.GET, produces = "application/json")
    public Chat getChat(@PathVariable Long chatId, HttpServletRequest httpRequest) throws Exception {
        
    	// try to load message and chat
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
    		
    		
    		// B) add transient chat partner info
    		if (userIsHost) {
    			// show member as chat partner
    			if (chat.getMembers().length==1) {
    				setChatPartnerInfoOn(userService, chat, chat.getMembers()[0]);
    			} else {
    				LOGGER.warn("Cannot set ChatPartnerInfo on chats with more than one member.");
    			}
    		} else {
    			// show host as chat partner
    			setChatPartnerInfoOn(userService, chat, chat.getHostId());
    		}
    
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	// load messages of chat
    	List<Message> messages = messageService.getAllMessagesOfChat(chat.getId());
    	chat.setMessages(messages);
    	
    	return chat;
    }
    
    public static void setChatPartnerInfoOn(UserService userService,Chat chat, Long chatPartnerUserId) {
    	User user = userService.findById(chatPartnerUserId);
    	if (user==null) {
    		LOGGER.warn("Cannot set ChatPartnerInfo for user("+chatPartnerUserId+") - NOT FOUND");
    		return;
    	}
    	chat.setChatPartnerId(user.getId());
    	chat.setChatPartnerName(user.getName());
    	if ((user.getImageMediaID()!=null) && (user.getImageMediaID()>0)) chat.setChatPartnerImageMediaID(user.getImageMediaID());
    	if ((user.getSpokenLangs()!=null) && (user.getSpokenLangs().length>0)) chat.setChatPartnerSpokenLangs(user.getSpokenLangs());
    }
    
    //---------------------------------------------------
    // MESSAGE Controller
    //---------------------------------------------------

    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}/message", method = RequestMethod.POST, produces = "application/json")
    public Message addMessage(@PathVariable Long chatId, @RequestBody @Valid final Message template, HttpServletRequest httpRequest) throws Exception {
    	
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
    		
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	// security override on template
    	template.setId(null);
    	template.setTime(System.currentTimeMillis());
    	template.setChatId(chat.getId());
    	    	
    	// TODOD check that itemId exists
    	
    	// create new user
    	Message message = messageService.create(template);
    	LOGGER.info("Message("+message.getId()+") CREATED on chat("+chatId+")");
        return message;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{chatId}/message/{messageId}", method = RequestMethod.GET, produces = "application/json")
    public Message acctionMessage(@PathVariable Long chatId, @PathVariable Long messageId, HttpServletRequest httpRequest) throws Exception {
        
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
