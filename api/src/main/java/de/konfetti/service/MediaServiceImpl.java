package de.konfetti.service;

import de.konfetti.data.MediaItem;
import de.konfetti.data.MediaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MediaServiceImpl extends BaseService implements MediaService {

	@Autowired
	public MediaServiceImpl(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }
    
    @Override
    public MediaItem create(MediaItem  item) {
    	
        MediaItem persited = mediaRepository.saveAndFlush(item);
		log.debug("MediaItem(" + persited.getId() + ") CREATED");
		return persited;
        
    }

    @Override
    public MediaItem  findById(long id) {
		log.debug("MediaItem(" + id + ") READ");
		return mediaRepository.findOne(id);
    
    }

	@Override
	public void update(MediaItem item) {
		log.debug("MediaItem(" + item.getId() + ") UPDATED");
		mediaRepository.saveAndFlush(item);
	}
    
}
