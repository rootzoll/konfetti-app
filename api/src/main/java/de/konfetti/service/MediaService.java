package de.konfetti.service;

import de.konfetti.data.MediaItem;

public interface MediaService {

    MediaItem create(MediaItem chat);

    MediaItem findById(long id);

	void update(MediaItem item);
    
}