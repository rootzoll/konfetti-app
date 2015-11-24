package de.konfetti.service;

import de.konfetti.data.User;

/**
 * Created by catarata02 on 08.11.15.
 */
public interface UserService {

    User create();

    User findById(long userId);
}