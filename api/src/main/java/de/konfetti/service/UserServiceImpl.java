package de.konfetti.service;

import java.util.List;

import de.konfetti.data.User;
import de.konfetti.data.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends BaseService implements UserService {

    public UserServiceImpl() {
    }

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public User create() {
    	
    	// user gets created
        User user = new User();

        // user gets persisted and returned to user  
        User persited = userRepository.saveAndFlush(user);
        
        // return to caller
        return persited;
        
    }

    @Override
    public User findById(long id) {
    	
    	// gets the one with the given id
        return userRepository.findOne(id);
    
    }

	@Override
	public User findByClientId(long clientId) {
		Long clientID = new Long(clientId);
		List<User> all = userRepository.findAll();
		for (User user : all) {
			if (user.getClientId().equals(clientID)) return user;
		}
		return null;
	}

	@Override
	public User update(User user) {
		return userRepository.saveAndFlush(user);
	}
    
}
