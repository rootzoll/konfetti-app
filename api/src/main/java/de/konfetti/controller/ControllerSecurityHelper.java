package de.konfetti.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.konfetti.data.Client;
import de.konfetti.service.ClientService;

public class ControllerSecurityHelper {

	private static final Logger LOGGER = LoggerFactory.getLogger(ControllerSecurityHelper .class);
	
	/*
	 * ADMIN-LEVEL
	 * all methods on REST API that are open for users, but for other service layers or applications
	 */
	
	// 1. IP-Security
	private static final boolean enforceCheckIP = true;
	private static final String[] allowedIPs = {"127.0.0.1"};
	
	// 2. PASSWORD-Security
	private static final boolean enforcePassword = false;
	private static final String[]  allowedPasswords = {"pleaseSetLongPassword"};
	
	
	// if throws an Exception ==> security check failed
	@SuppressWarnings("unused")
	public static void checkAdminLevelSecurity(HttpServletRequest req) throws Exception {
		
		// detect no security
		if ((!enforceCheckIP) && (!enforcePassword)) {
			throw new Exception("ControllerSecurityHelper: MISSING ADMIN LEVEL SECURITY - BLOCKING");
		}
		
		// check IP security
		if (enforceCheckIP) {

			// get IP from request
			String requestingIP = req.getRemoteAddr(); 
			
			// check if requested IP is within allowed IPs
			boolean correctIP = false;
			for (String allowedIP : allowedIPs) {
				if ((allowedIP!=null) && (allowedIP.equals(requestingIP))) {
					correctIP = true;
					break;
				}
			}
			if (!correctIP) throw new Exception("ControllerSecurityHelper: Requesting IP("+requestingIP+") is not allowed for ADMIN-LEVEL SECURITY");
		}
		
		// check PASSWORD security
		if (enforcePassword) {
			
			// when password is used - HTTPS is mandatory
			if (!req.isSecure()) throw new Exception("ControllerSecurityHelper: HTTPS is needed when password security is used from IP("+req.getRemoteAddr()+")");
			
			// get password from HTTP header
			String requestingPassword = req.getHeader("X-ADMIN-PASSWORD"); 
			if (requestingPassword==null) throw new Exception("ControllerSecurityHelper: Missing X-ADMIN-PASSWORD header field on HTTP request for ADMIN-LEVEL SECURITY from IP("+req.getRemoteAddr()+")");
			
			// check if given password is valid
			boolean correctPassword = false;
			for (String allowedPassword : allowedPasswords) {
				if ((allowedPassword!=null) && (allowedPassword.equals(requestingPassword))) {
					correctPassword = true;
					break;
				}
			}
			if (!correctPassword) throw new Exception("ControllerSecurityHelper: Requesting Password("+requestingPassword+") is not correct for ADMIN-LEVEL SECURITY from IP("+req.getRemoteAddr()+")");
			
		}
		
	}
		
	public static Client getClientFromRequestWhileCheckAuth(HttpServletRequest req, ClientService clientService) throws Exception {
		

		// get user credentials from HTTP header
		String clientId = req.getHeader("X-CLIENT-ID"); 
		String clientSecret = req.getHeader("X-CLIENT-SECRET"); 
		
		// check if input data is valid
		if ((clientId==null) || (clientSecret==null)) throw new Exception("ControllerSecurityHelper: Missing X-CLIENT-* fields on client request from IP("+req.getRemoteAddr()+")");
		if ((clientId.indexOf(" ")>=0) || (clientSecret.indexOf(" ")>=0)) throw new Exception("ControllerSecurityHelper: Missing X-CLIENT-* fields contain ' ' ("+clientId+"/"+clientSecret+") from IP("+req.getRemoteAddr()+")");
		Long clientIdLong =  null;
		try {
			clientIdLong = Long.parseLong(clientId);
		} catch (Exception e) {
			throw new Exception("ControllerSecurityHelper: X-CLIENT-ID id no Number ("+clientId+"/"+clientSecret+") from IP("+req.getRemoteAddr()+")");
		}
		
		// check if client exists
		Client client = clientService.findById(clientIdLong);
		if (client==null) {
			Thread.sleep(300); // security delay against brute force
			throw new Exception("ControllerSecurityHelper: No client found with id ("+clientId+") from IP("+req.getRemoteAddr()+")");
		}
		
		// check if client has correct secret
		if (!clientSecret.equals(client.getSecret())) {
			Thread.sleep(300); // security delay against brute force
			throw new Exception("ControllerSecurityHelper: Client("+clientId+") wrong secretGiven("+clientSecret+") should be secretIs("+client.getSecret()+") from IP("+req.getRemoteAddr()+")");
		}

		// check HTTPS --> should be used to protect secret on transport
		if (!req.isSecure()) {
			LOGGER.warn("ControllerSecurityHelper: No HTTPS security ("+clientId+"/"+clientSecret+") from IP("+req.getRemoteAddr()+")");
		}
		
		return client;
		
	}
}
