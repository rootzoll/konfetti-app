package de.konfetti.service;

import de.konfetti.data.MediaItem;
import de.konfetti.data.MediaRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MediaServiceImpl extends BaseService implements MediaService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MediaServiceImpl.class);

    public MediaServiceImpl() {
    }

    @Autowired
    public MediaServiceImpl(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }
    
    @Override
    public MediaItem create(MediaItem  item) {
    	
        MediaItem persited = mediaRepository.saveAndFlush(item);
        LOGGER.info("MediaItem("+persited.getId()+") CREATED"); 
        return persited;
        
    }

    @Override
    public MediaItem  findById(long id) {
		LOGGER.info("MediaItem("+id+") READ"); 
        return mediaRepository.findOne(id);
    
    }

	@Override
	public void update(MediaItem item) {
		LOGGER.info("MediaItem("+item.getId()+") UPDATED"); 
		mediaRepository.saveAndFlush(item);
	}
    
}
