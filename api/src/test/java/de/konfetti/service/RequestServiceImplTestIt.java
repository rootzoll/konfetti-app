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

    private RequestService requestService;

    private PartyService partyService;

    @Before
    public void setUp() throws Exception {
        requestService = new RequestServiceImpl(partyRepository, requestRepository);
        partyService = new PartyServiceImpl(partyRepository);

        partyRepository.deleteAll();
    }

    @Test
    public void testCreateRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(party.getId(), testRequest);

        // assert all values correctly stored
        assertTrue("Request created successfully", testHelper.equalRequests(createdRequest, testRequest));
        assertNotNull("id not null", createdRequest.getId());
        assertTrue("id not 0", createdRequest.getId() > 0);
        assertEquals("same party in request", party, createdRequest.getParty());
        assertTrue("same request in party", testHelper.equalRequests(createdRequest, partyRepository.findOne(party.getId()).getRequestSet().iterator().next()));
    }

    @Test
    public void testUpdateRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(party.getId(), testRequest);

        String modiefiedTitle = "modiefiedTitle";
        createdRequest.setTitle(modiefiedTitle);
        String modifiedImageUrl = "modifiedImageUrl";
        createdRequest.setImageUrl(modifiedImageUrl);
        Request modfiedRequest = requestService.update(party.getId(), createdRequest);

        // assert all values correctly stored
        assertTrue("Party updated successfully", testHelper.equalRequests(modfiedRequest, createdRequest));
        assertNotNull("id not null", modfiedRequest.getId());
        assertTrue("id not 0", modfiedRequest.getId() > 0);
    }

    @Test
    public void testDeleteRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(party.getId(), testRequest);

        Request deletedRequest = requestService.delete(party.getId(), createdRequest.getId());

        // assert all values correctly stored
        assertTrue("Request deleted successfully", testHelper.equalRequests(deletedRequest, testRequest));

        // assert that request is not existing anymore
        List<Request> lists = requestService.getAllPartyRequests(party.getId());
        assertEquals("no list found", 0, lists.size());
    }

    private Party persistDefaultParty(TestHelper testHelper, PartyService partyService) {
        Party testParty = testHelper.getTestParty1();
        Party createdParty = partyService.create(testParty);
        return  createdParty;
    }

}