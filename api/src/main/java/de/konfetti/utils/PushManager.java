package de.konfetti.utils;

import lombok.extern.slf4j.Slf4j;

import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

/*
 * Use to send push notifications to apps.
 */
@Slf4j
public class PushManager {

	public static final int PLATFORM_ANDROID = 1;
	public static final int PLATFORM_IOS = 1; 
	
	private static PushManager singleton = null;
	
	private String appID;
	private String basicAuth;
	
	private PushManager() {
		this.appID = Helper.getPropValues("konfetti.pushID");
		this.basicAuth = Helper.getPropValues("konfetti.pushAuth");		
	}
	
	public static PushManager getInstance() {
		if (singleton==null) singleton = new PushManager();
		return singleton;
	}

	public static int mapUserPlatform(String pushSystem) {
		// TODO map user.pushSystem values to this class finals
		return PLATFORM_ANDROID;
	}
		
	public boolean isAvaliable() {
		if (this.appID==null) return false;
		if (this.appID.trim().length()==0) return false;
		if (this.basicAuth==null) return false;
		return this.basicAuth.trim().length() != 0;
	}

	public boolean sendNotification(int platformUSEFINALS, String userPushID, String messageEnglish, String locale, String messageLocale, Long notificationID) {

		if (!isAvaliable()) {
			log.warn("PushManager not configured - not possible");
			return false;
		}

		try {

			  /*
			   * PREPARE JSON DATA
			   */

			String additionalLanguage = "";
			  if ((locale!=null) && (messageLocale!=null)) additionalLanguage = ", \""+locale+"\": \""+messageLocale+"\"";
			  String json = "{\"app_id\": \""+this.appID+"\",\"include_player_ids\":[\""+userPushID+"\"],\"data\": {\"notification\": \""+notificationID+"\"},\"contents\": {\"en\": \""+messageEnglish+"\""+additionalLanguage+"}}";


			  /*
			   * HTTP REQUEST --> ONESIGNAL REST API
			   */

			URL url = new URL("https://onesignal.com/api/v1/notifications");
			  HttpURLConnection httpCon = (HttpURLConnection) url.openConnection();
			  httpCon.setDoInput(true);
			  httpCon.setDoOutput(true);
			  httpCon.setRequestProperty("Content-Type", "application/json");
			  httpCon.setRequestProperty("Authorization", "Basic "+this.basicAuth);
			  httpCon.setRequestMethod("POST");
			  OutputStreamWriter out = new OutputStreamWriter(httpCon.getOutputStream());
			  out.append(json);
			  out.flush();
			  int resultCode = httpCon.getResponseCode();
			  String resultMessage = httpCon.getResponseMessage();
			  out.close();

			if (resultCode!=200) {
				log.warn("FAIL HTTP REQUEST POST https://onesignal.com/api/v1/notifications");
				log.warn(json);
				log.warn("(" + resultCode + ") '" + resultMessage + "'");
				  return false;
			  } else {
				log.info("OK PushNotification -> https://onesignal.com/api/v1/notifications");
			  }

			return true;

		} catch (Exception e) {
			log.warn("FAIL on sending push message", e);
			e.printStackTrace();
			return false;
		}


	}
	
	
}
