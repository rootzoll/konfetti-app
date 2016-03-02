package de.konfetti.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AccountingTools {

    private static final Logger LOGGER = LoggerFactory.getLogger(AccountingTools.class);
	
	public static String getAccountNameFromUserAndParty(Long userId, Long partyID) {
		return "u"+userId+"p"+partyID;
	}
	
	public static String getAccountNameFromRequest(Long requestId) {
		return "r"+requestId;
	}
	
	public static String getAccountNameFromParty(Long partyId) {
		return "p"+partyId;
	}
	
	public static Long getUserIdFromAccountName(String accountName) {
		Long result = null;
		try {
			int index = accountName.indexOf("p");
			if (index>=1) {
				result = Long.parseLong(accountName.substring(1, index));
			} else {
				LOGGER.warn("Was not able to find party delimiter in : "+accountName);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}	
		return result;
	}

	public static Long getPartyIdFromAccountName(String accountName) {
		Long result = null;
		try {
			result = Long.parseLong(accountName.substring(accountName.indexOf("p")+1));
		} catch (Exception e) {
			e.printStackTrace();
		}	
		return result;
	}
	
}
