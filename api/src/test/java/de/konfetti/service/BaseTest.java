package de.konfetti.service;

import de.konfetti.Application;
import de.konfetti.controller.TestHelper;
import org.junit.runner.RunWith;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * Created by relampago on 05.03.16.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@ActiveProfiles("test")
public class BaseTest {

    protected final TestHelper testHelper = new TestHelper();

}
