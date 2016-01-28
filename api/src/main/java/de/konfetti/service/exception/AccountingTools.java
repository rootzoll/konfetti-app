package de.konfetti.service.exception;

public class AccountingTools {

	public static String getAccountNameFromUserAndParty(Long userId, Long partyID) {
		return "u"+userId+"p"+partyID;
	}
	
	public static String getAccountNameFromRequest(Long requestId) {
		return "r"+requestId;
	}
	
	public static String getAccountNameFromParty(Long partyId) {
		return "p"+partyId;
	}
	
}
