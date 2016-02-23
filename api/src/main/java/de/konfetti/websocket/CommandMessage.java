package de.konfetti.websocket;

public class CommandMessage {

	  public static final String COMMAND_PING = "ping";
	  public static final String COMMAND_PONG = "pong";
	  public static final String COMMAND_PARTYUPADTE = "update-party";
	 
	  private String command;
	  private String data;
	  
	  public CommandMessage() {
	  }
	  
	  public CommandMessage(String command, String data) {
	    this.setCommand(command);
	    this.setData(data);
	  }

	  public String getData() {
		return data;
	  }

	  public void setData(String data) {
		this.data = data;
	  }

	  public String getCommand() {
		return command;
	  }

	  public void setCommand(String command) {
		this.command = command;
	  }

	}
