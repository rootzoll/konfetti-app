package de.konfetti.service;

import de.konfetti.Application;
import de.konfetti.controller.TestHelper;
import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import de.konfetti.data.Request;
import de.konfetti.data.RequestRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.List;

import static org.junit.Assert.*;

/**
 * Created by catarata02 on 08.11.15.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@ActiveProfiles("test")
public class RequestServiceImplTestIt {

    private final TestHelper testHelper = new TestHelper();

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private RequestRepository requestRepository;


    private PartyService partyService;

    @Before
    public void setUp() throws Exception {
    }

    @Test
    public void testCreateRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

    }


    private Party persistDefaultParty(TestHelper testHelper, PartyService partyService) {
        Party testParty = testHelper.getTestParty1();
        Party createdParty = partyService.create(testParty);
        return  createdParty;
    }

}