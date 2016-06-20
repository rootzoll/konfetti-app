package de.konfetti.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.support.MessageSourceResourceBundle;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.activation.URLDataSource;
import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Locale;


/*
 * Use to send eMails.
 * 
 * To get Spring JavaMailSender user AutoWire in Component classes:
 * @Autowired
 * private JavaMailSender javaMailSender;
 * 
 * --> see application.properties file for configuration
 */
@Slf4j
@Service
public class EMailManager {

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${konfetti.sendFromMailAddress}")
    private String fromEmailAddress;

    @Value("${konfetti.replyToMailAddress}")
    private String replyToAddress;

    /**
     * Sending an eMail with and optional attachment.
     *
     * @param toAddress
     * @param subjectKey
     * @param bodyText
     * @param urlAttachment HTTP URL string to attachment file - if NULL = no attachment
     * @return
     */
    public boolean sendMail(String toAddress, String subjectKey, String bodyText, String urlAttachment, String[] spokenLangs) {
        fromEmailAddress = fromEmailAddress.trim();
        replyToAddress = replyToAddress.trim();
        if (replyToAddress == null) replyToAddress = fromEmailAddress;

        Locale locale;
        if (spokenLangs == null || spokenLangs.length == 0) {
            locale = getDefaultLocale();
        } else {
            locale = Locale.forLanguageTag(spokenLangs[0]);
        }
        String subjectText = MessageSourceResourceBundle.getBundle("messages", locale).getString(subjectKey);

        if ((toAddress == null) || (toAddress.length() <= 3)) {
            log.warn("failed sending email because toAdrress(" + toAddress + ") is unvalid");
            return false;
        }

        if ((fromEmailAddress == null) || (fromEmailAddress.length() == 0) || fromEmailAddress.equals("test@test.de")) {
            log.warn("eMail not configured in application.properties - skipping sending to " + toAddress);
            return false;
        }


        toAddress = toAddress.trim();

        MimeMessage mail = javaMailSender.createMimeMessage();
        try {
            log.info("EMailManager - sending eMail to(" + toAddress + ") ...");
            MimeMessageHelper helper = new MimeMessageHelper(mail, true);
            helper.setTo(toAddress);
            helper.setReplyTo(replyToAddress);
            helper.setFrom(fromEmailAddress);
            helper.setSubject(subjectText);
            helper.setText(bodyText);
            if (urlAttachment != null)
                helper.addAttachment("KonfettiCoupons.pdf", new URLDataSource(new URL(urlAttachment)));
            javaMailSender.send(mail);
            log.info("EMailManager - OK sending eMail to(" + toAddress + ")");
            return true;
        } catch (MessagingException e) {
            log.warn("EMailManager - FAIL sending eMail to(" + toAddress + "): " + e.getMessage());
            e.printStackTrace();
        } catch (MalformedURLException e) {
            log.warn("EMailManager - FAIL sending eMail to(" + toAddress + ") attachementURL(" + urlAttachment + "): " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            log.warn("EMailManager - FAIL sending eMail to(" + toAddress + ") attachementURL(" + urlAttachment + ") mailserver(" + Helper.getPropValues("spring.mail.host") + ":" + Helper.getPropValues("spring.mail.port") + "): " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    private Locale getDefaultLocale() {
        Locale locale;
        locale = Locale.getDefault();
        return locale;
    }

    public String getFromEmailAddress() {
        return fromEmailAddress;
    }

    public String getReplyToAddress() {
        return replyToAddress;
    }


}
