package de.konfetti.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
public class WebsocketEndpoint {

	@MessageMapping("/websocket")
	@SendTo("/out/updates") // TODO: try sendtouser later on
    public CommandMessage greeting(CommandMessage message) throws Exception {

		log.info("WEBSOCKET Incoming Message command(" + message.getCommand() + ") data(" + message.getData() + ")");

		if ("ping".equals(message.getCommand())) {
        	return new CommandMessage("pong","hello "+message.getData());
        } else {
        	return new CommandMessage("fail","unknown command "+message.getCommand());
        }
        
    }

}
