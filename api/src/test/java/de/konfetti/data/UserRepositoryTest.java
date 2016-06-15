package de.konfetti.data;

import de.konfetti.service.BaseTest;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.Assert.assertEquals;

/**
 * Created by relampago on 12.06.16.
 */
public class UserRepositoryTest extends BaseTest {

    @Autowired
    private UserRepository userRepository;

	private Long clientIdOne = 1L;
	private Long clientIdTwo = 2L;
	private String emailOne = "email1@test.de";
    private String emailTwo = "email2@test.de";


//    @Test
//    public void findByClientId() throws Exception {
//        createUser(clientIdOne, emailOne);
//        createUser(clientIdTwo, emailTwo);
//        User foundUser = userRepository.findByClientId(clientIdOne);
//        assertEquals("found user with clientId", clientIdOne, foundUser.getClientId());
//    }

    @Test
    public void findByEMail() throws Exception {
        createUser(clientIdOne, emailOne);
        createUser(clientIdTwo, emailTwo);
        User foundUser = userRepository.findByEMail(emailOne);
		assertEquals("found user with email", emailOne, foundUser.getEMail());
	}

    private void createUser(Long clientId, String email){
        User user = new User();
        user.setClientId(clientId);
		user.setEMail(email);
		userRepository.save(user);
    }

}