package de.konfetti.service;

import de.konfetti.data.User;

public interface UserService {

    User create();

	User update(User user);
    
    User findById(long userId);
    
    User findByClientId(long clientId);

	User findByMail(String mail);

}