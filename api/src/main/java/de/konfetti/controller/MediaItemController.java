package de.konfetti.controller;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import de.konfetti.data.Client;
import de.konfetti.data.MediaItem;
import de.konfetti.data.mediaitem.MultiLang;
import de.konfetti.service.ClientService;
import de.konfetti.service.MediaService;
import de.konfetti.utils.AutoTranslator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

@CrossOrigin
@RestController
@RequestMapping("konfetti/api/media")
public class MediaItemController {

    private static final Logger LOGGER = LoggerFactory.getLogger(MediaItemController.class);
	
    private final ClientService clientService;
    private final MediaService mediaService;

    @Autowired
    public MediaItemController(final ClientService clientService, final MediaService mediaService) {
        this.clientService = clientService;
        this.mediaService = mediaService;
    }

    //---------------------------------------------------
    // MEDIA ITEM Controller
    //---------------------------------------------------
    
    @CrossOrigin(origins = "*")
    @RequestMapping(method = RequestMethod.POST, produces = "application/json")
    public MediaItem createMedia(@RequestBody @Valid final MediaItem template, HttpServletRequest httpRequest) throws Exception {
    	
    	// check if user is allowed to create
    	if (httpRequest.getHeader("X-CLIENT-ID")!=null) {
    		
    		// A) check that chat is just hosted by user
    		Client client = ControllerSecurityHelper.getClientFromRequestWhileCheckAuth(httpRequest, clientService);
    		if (client==null) throw new Exception("client is NULL");
        	template.setUserId(client.getUserId());
        	
    	} else {
    		
    		// B) check for trusted application with administrator privilege
        	ControllerSecurityHelper.checkAdminLevelSecurity(httpRequest);
    	}
    	
    	// security override on template
    	template.setId(null);
    	template.setLastUpdateTS(System.currentTimeMillis());
    	
    	// check if type is supported
    	boolean typeIsSupported = false;
    	if (String.class.toString().equals(template.getType())) typeIsSupported = true;
    	if (MultiLang.class.toString().equals(template.getType())) typeIsSupported = true;
    	if (!typeIsSupported) throw new Exception("type("+template.getType()+") is not supported as media item");
    	
    	// MULTI-LANG auto translation
    	if (MultiLang.class.toString().equals(template.getType())) {
    		LOGGER.info("Is MultiLang --> AUTOTRANSLATION");
    		try {
    			MultiLang multiLang = new ObjectMapper().readValue(template.getData(), MultiLang.class);
    			multiLang = AutoTranslator.getInstance().reTranslate(multiLang);
    			template.setData(new ObjectMapper().writeValueAsString(multiLang));
    			LOGGER.info(template.getData());
    		} catch (Exception e) {
    			e.printStackTrace();
    			throw new Exception("MultiLang Data is not valid: "+e.getMessage());
    		}
    	} else {
    		LOGGER.info("NOT MultiLang --> no special treatment needed");
    	}
    	  	    	
    	// create new user
    	MediaItem item = mediaService.create(template);
    	LOGGER.info("OK mediaItem("+item.getId()+") created");
        return item;
    }
    
    @CrossOrigin(origins = "*")
    @RequestMapping(value="/{mediaId}", method = RequestMethod.GET, produces = "application/json")
    public MediaItem getMedia(@PathVariable Long mediaId, HttpServletRequest httpRequest) throws Exception {
        
    	// try to load message and chat
    	MediaItem item = mediaService.findById(mediaId);
    	if (item==null) throw new Exception("media("+mediaId+") not found");

    	return item;
    }
 
}
