package de.konfetti.notifier;

import com.google.common.cache.CacheBuilder;
import de.konfetti.data.Notification;
import de.konfetti.data.User;
import de.konfetti.service.NotificationService;
import de.konfetti.service.UserService;
import de.konfetti.utils.EMailManager;
import de.konfetti.utils.PushManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.Cache.ValueWrapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.guava.GuavaCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

/*
 * A task that is scheduled to check in short periods 
 * if there is any notification to be delivered by email or push. 
 * 
 * Is designed to run as a scheduled singleton process with access to database.
 * 
 * TODO: add push notification support - just email for now
 *
 */
@Slf4j
@Component
public class NotifierBackgroundTask {

	private static final String PUSHTYPE_IGNORE = "ignore";
	private static final String PUSHTYPE_NOTPOSSIBLE = "not-possible";
	private static final String PUSHTYPE_FAIL = "fail";
	private static final String PUSHTYPE_EMAIL = "email";
	private static final String PUSHTYPE_PUSH = "push";

	private static long lastProcessingStart = 0l;
	
    @Autowired
    private JavaMailSender javaMailSender;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    private Random randomGenerator;

    /*
     *  CACHE 1 "Pushed Users" - make sure just one/push/user all 15min max
     */
	
	private Cache spamBlockerPerUserCache;
    
    /*
     *  CACHE 2 "Processed Notifications" - notification persistence can have a storage sync latency up to 15 minutes on processed flag
     */
	
	private Cache processedNotificationsCache;

	public NotifierBackgroundTask() {
		log.info("CONTRUCTOR BACKGROUNDTASK");
		this.processedNotificationsCache = this.cacheManager().getCache("processedNotifications");
		this.spamBlockerPerUserCache = this.cacheManager().getCache("spamBlockerPerUser");
		this.randomGenerator = new Random();
	}
	
	/*
	 * Constructor
	 */

	@Bean
	public CacheManager cacheManager() {
		GuavaCacheManager guavaCacheManager = new GuavaCacheManager();
		guavaCacheManager.setCacheBuilder(CacheBuilder.newBuilder().expireAfterWrite(15, TimeUnit.MINUTES));
		return guavaCacheManager;
	}
    
	/*
	 *  This is the timer thread started by Spring to ensure that 
	 *  the background task gets scheduled often. 
	 *  
	 *  Spring boost takes care not to start the task when still running.
	 */
    @Scheduled(fixedRate = 5000)
    public void periodicStartUpTimer() {
    	
    	// prepare start
    	lastProcessingStart = System.currentTimeMillis();
		log.debug("Starting NotifierBackgroundTask loop ...");

		// start notifier background task loop and catch all problems
    	try {
    		
    		// do the actual work
    		runNotifierBackgroundTaskThread();
    		
        	// statistics
        	long timeSinceStartupInSeconds = (System.currentTimeMillis() - lastProcessingStart) / 1000l;
			log.info("Ended NotifierBackgroundTask loop in " + timeSinceStartupInSeconds + " seconds.");

		} catch (Exception e) {
			log.error("EXCEPTION on NotifierBackgroundTask loop: ", e);
			e.printStackTrace();
    	}

		log.info("");

    }
    
    /*
     * What the background task actually does when running (one loop)
     */
    private void runNotifierBackgroundTaskThread() throws InterruptedException {
    	

    	/*
    	 * Going thru all pending notifications and see which to level up to email or push
    	 */
    	
    	// TODO: get just pending notifications form database (at the moment all that are not deleted)
    	List<Notification> pendingNotifications = notificationService.getAllPossiblePushNotifications();
		log.info("--> PENDING NOTIFICATIONS: " + pendingNotifications.size());

		for (Notification notification : pendingNotifications) {
    		
			// check if already handled since last restart
			if (!wasNotificationAlreadyGivenHigherAttention(notification)) {

				log.info("|");
				log.info(" -> PROCESSING NOTIFICATION(" + notification.getId() + ")");

				// decide if notification needs more attention from user
        		if (shouldNotificationGetHigherAttention(notification)) {

					log.info("--> needs higher attention");

					// to prevent spamming the user
        			if (userNotFeelingSpammedYet(notification)) {

						log.info(" -> SEND PUSH TO USER");

						// decide if eMail or push notification
        				String typeOfPush = getTypeOfPushForUser(notification);
        				
        				// if not possible ok - see as done
        				if (PUSHTYPE_NOTPOSSIBLE.equals(typeOfPush)) {
							log.info(" -> OK - NOT POSSIBLE TO SEND ANY HIGHER PUSH TO USER");
							markNotificationAsPushed(notification, typeOfPush);
        					return;
        				}
        				
        				// email push
        				if (PUSHTYPE_EMAIL.equals(typeOfPush)) {

							log.info(" -> SEND EMAIL");
							if (sendPushMail(notification)) {

								log.info(" -> OK - PUSH SEND BY EMAIL");
								markNotificationAsPushed(notification, typeOfPush);
        						
        						// remember last notification to user for short period of time
        						this.spamBlockerPerUserCache.put(notification.getUserId(), notification);
        					
        					} else {

								log.warn(" -> SEND NOT SUPPORTED PUSH: " + typeOfPush);
								markNotificationAsPushed(notification, PUSHTYPE_FAIL);
          						
        					}
        					
            				// do push notification
            				} else if (PUSHTYPE_PUSH.equals(typeOfPush)) {

							log.info(" -> SEND PUSH");
							sendPushPush(notification);

							log.info(" -> OK - PUSH SEND BY EMAIL");
							markNotificationAsPushed(notification, typeOfPush);
        						
        						// remember last notification to user for short period of time
        						this.spamBlockerPerUserCache.put(notification.getUserId(), notification);
            					
            				// not supported push
            				} else {

							log.warn(" -> SEND TO PUSH: " + typeOfPush);

						}
        				
        			} else {
						log.info(" -> USER UNDER SPAM PROTECTION - DELAYING PUSH");
					}
    				
    			} else {
					log.info("--> IGNORE");
				}
    			
    		} else {
				log.debug(" -> ALREADY PROCESSED");
			}
    		
		}
    	
    }

	/*
     * Takes a notification and decides if it needs to be pushed
     */
	private boolean shouldNotificationGetHigherAttention(Notification notification) {

		long oldInSeconds = (System.currentTimeMillis() - notification.getTimeStamp()) / 1000l;
		log.info("Notification seconds(" + oldInSeconds + ") id(" + notification.getId() + ") party(" + notification.getPartyId() + ") user(" + notification.getUserId() + ") type(" + notification.getType() + ")");
		
		/*
		 * SIMPLE HIGHER ATTENTION CASES
		 */
		if (Notification.TYPE_REVIEW_OK==notification.getType()) return true;
		if (Notification.TYPE_REVIEW_FAIL==notification.getType()) return true;
		if (Notification.TYPE_CHAT_NEW==notification.getType()) return true;
		if (Notification.TYPE_REWARD_GOT==notification.getType()) return true;
		if (Notification.TYPE_SUPPORT_WIN==notification.getType()) return true;
		
		/*
		 * REVIEW WAITING ==> select one reviewer/admin by random
		 */
		if (Notification.TYPE_REVIEW_WAITING == notification.getType()) {
			
			// get all reviewer and admins for party
			List<User> reviewer = userService.getAllUsersReviewerOnParty(notification.getPartyId());
			
			// filter all that dont have email or push active
			List<User> hasPush = new  ArrayList<User>();
			for (User user : reviewer) {
				if ((user.getPushActive()) || ((user.getEMail() != null) && (user.getEMail().trim().length() > 2))) {
					hasPush.add(user);
				}
			}
			reviewer = hasPush;
			
			// no reviewers --> close notification
			if (reviewer.size()<=0) {
				log.warn("Party(" + notification.getPartyId() + ") has no admin or reviewer to deliver notification to.");
				markNotificationAsPushed(notification, PUSHTYPE_IGNORE);
				return false;
			}
			
			// find take one by random and set as new user reference in notification
			int randomIndex = this.randomGenerator.nextInt(reviewer.size());
			Long randomReviewerId =  reviewer.get(randomIndex).getId();
			log.debug("REVIEWER is user(" + randomReviewerId + ")");
			notification.setUserId(randomReviewerId);
			
			return true;
		}
		
		/*
		 * DEFAULT ==> ALL OTHER MESSAGES ==> MARK AS DONE
		 */
		markNotificationAsPushed(notification, PUSHTYPE_IGNORE);
		return false;
		
	}
			

	/*
	 * TODO maybe cache recently processed IDs if persistence gets more decoupled 
	 */
	
    private boolean wasNotificationAlreadyGivenHigherAttention(Notification notification) {
    	ValueWrapper cacheState = processedNotificationsCache.get(notification.getId());
    	if (cacheState==null) {
    		// no information on local cache - trust value from persistence
    		return notification.getHigherPushDone();
    	} else {
    		long oldInSeconds = (System.currentTimeMillis() - notification.getTimeStamp()) / 1000l;
			log.warn("Cache has different state than Notification(" + notification.getId() + ") type(" + notification.getType() + ") old(" + oldInSeconds + ")secs from persistence: " + cacheState.get());
			return true;
    	}
		
	}
    
    private void markNotificationAsPushed(Notification notification, String type) {
    	
    	// remember notification as processed
    	processedNotificationsCache.put(notification.getId(), type);

    	// decide to keep or delete the notification
    	boolean keepNotification = true;
    	if (notification.getType()==Notification.TYPE_REVIEW_WAITING) keepNotification = false;
    	
    	if (keepNotification) {
    		
    		// keep but remember that pushed 
     		notificationService.setNotificationAsPushProcessed(notification.getId());
    	} else {
    		
    		// delete
			log.info("Deleting notification(" + notification.getId() + ")");
			notificationService.delete(notification.getId());
    	}
    }
    
	/*
	 * returns true when it seems OK to send another push to user
	 */
    private boolean userNotFeelingSpammedYet(Notification notification) {

    	/*
    	 * Check if user was active recently
    	 */
    	
		User user = userService.findById(notification.getUserId());
		if (user.wasUserActiveInLastMinutes(3)) {
			log.info("User(" + user.getId() + ") was/is active on App ... wait with push.");
			return false;
		}
    	
    	
    	/*
    	 *  Check Pushes send ..
    	 */
    	
    	ValueWrapper inCache = spamBlockerPerUserCache.get(notification.getUserId());
    	
    	// if no notification recently --> go ahead
    	if (inCache==null) return true;
    	
    	Notification lastNotificationSendToUser = (Notification) inCache.get();
    	
    	// if there was a notification recently - ignore this one if same type
    	if (lastNotificationSendToUser.getType()==notification.getType()) {
			log.info("Notification is same type as send recently - IGNORE");
			markNotificationAsPushed(notification, PUSHTYPE_IGNORE);
    		return false;
    	}

		log.info("User got push noti recently --- so skipping this time");
		return false;
	}
    
    /*
     * decide how to send push on notification 
     */
	private String getTypeOfPushForUser(Notification notification) {
		
		User user = userService.findById(notification.getUserId());
		
		// check for push notification
		if ((user.getPushActive()) && (PushManager.getInstance().isAvaliable())) {
			
			// just push the following notifications
			if (Notification.TYPE_REVIEW_WAITING.equals(notification.getType())) return PUSHTYPE_PUSH;
			if (Notification.TYPE_REVIEW_OK.equals(notification.getType())) return PUSHTYPE_PUSH;
			if (Notification.TYPE_CHAT_NEW.equals(notification.getType())) return PUSHTYPE_PUSH;
			if (Notification.TYPE_REWARD_GOT.equals(notification.getType())) return PUSHTYPE_PUSH;
			if (Notification.TYPE_SUPPORT_WIN.equals(notification.getType())) return PUSHTYPE_PUSH;
		}
		
		// check for eMail
		if ((user.getEMail() == null) || (user.getEMail().trim().length() < 4)) {
			return PUSHTYPE_NOTPOSSIBLE;
		}
	
		return PUSHTYPE_EMAIL;
	}
	
	/*
	 * sending push by email
	 */
	private boolean sendPushMail(Notification notification) {
		
		User user = userService.findById(notification.getUserId());
		
		// TODO multi lang --- see user setting
		if (EMailManager.getInstance().sendMail(javaMailSender, user.getEMail(), "[konfetti] new events in your neighborhood", "Open Konfetti App so see more :D", null)) {
			log.info("OK - PUSH SEND BY EMAIL (" + user.getEMail() + ")");
			return true;
		} else {
			log.warn("FAIL - PUSH SEND BY EMAIL (" + user.getEMail() + ")");
			return false;
		}		
	}
	
	/*
	 * sending push by push
	 */
	private boolean sendPushPush(Notification notification) {
		
		User user = userService.findById(notification.getUserId());
		
		// TODO multi lang --- see user setting
		PushManager.getInstance().sendNotification(
				PushManager.PLATFORM_ANDROID, 
				user.getPushID(), 
				"new events in your neighborhood", 
				null, // locale 
				null, // localeMessage
				notification.getId());
		log.info("OK - PUSH SEND BY PUSH (" + user.getPushID() + ")");
	
		return true;
	}
		
}