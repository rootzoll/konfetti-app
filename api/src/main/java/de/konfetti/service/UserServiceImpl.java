package de.konfetti.service;

import de.konfetti.data.User;
import de.konfetti.data.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Created by relampago on 23.11.15.
 */
@Service
public class UserServiceImpl extends BaseService implements UserService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RequestServiceImpl.class);

    public UserServiceImpl() {
    }

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @Override
    public User create() {
        User user = new User();
        user.setSecret(UUID.randomUUID().toString());

        User persited = userRepository.saveAndFlush(user);
        persited.setClientId(persited.getId());
        return persited;
    }

    @Override
    public User findById(long userId) {
        return userRepository.findOne(userId);
    }
}
