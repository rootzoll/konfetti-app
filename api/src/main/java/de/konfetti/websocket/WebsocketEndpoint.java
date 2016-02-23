package de.konfetti.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import de.konfetti.controller.ChatController;

@Controller
public class WebsocketEndpoint {
	
    private static final Logger LOGGER = LoggerFactory.getLogger(ChatController.class);

    @MessageMapping("/websocket")
    @SendTo("/out/updates") // TODO: try sendtouser later on
    public CommandMessage greeting(CommandMessage message) throws Exception {
    	
    	LOGGER.info("WEBSOCKET Incoming Message command("+message.getCommand()+") data("+message.getData()+")");
    	        
        if ("ping".equals(message.getCommand())) {
        	return new CommandMessage("pong","hello "+message.getData());
        } else {
        	return new CommandMessage("fail","unknown command "+message.getCommand());
        }
        
    }

}
