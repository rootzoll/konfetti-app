package de.konfetti.service;

import de.konfetti.Application;
import de.konfetti.controller.TestHelper;
import de.konfetti.data.*;
import org.junit.Before;
import org.junit.Ignore;
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

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private MediaRepository mediaRepository;

    private RequestService requestService;

    private PartyService partyService;

    @Before
    public void setUp() throws Exception {
        requestService = new RequestServiceImpl(partyRepository, requestRepository, accountRepository, mediaRepository);
        partyService = new PartyServiceImpl(partyRepository);

        partyRepository.deleteAll();
    }

    @Test
    public void testCreateRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(testRequest);

        // assert all values correctly stored
        assertTrue("Request created successfully", testHelper.equalRequests(createdRequest, testRequest));
        assertNotNull("id not null", createdRequest.getId());
        assertTrue("id not 0", createdRequest.getId() > 0);
        // TODO: should work again the link betweeen parties and requests
        // assertEquals("same party in request", party, createdRequest.getPartyId());
        // assertTrue("same request in party", testHelper.equalRequests(createdRequest, partyService.findByName(party.getName());
    }

    @Ignore
    @Test
    public void testUpdateRequest() throws Exception {
        // TODO: make test to work again!!!

        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(testRequest);

        String modiefiedTitle = "modiefiedTitle";
        createdRequest.setTitle(modiefiedTitle);
        Long modifiedImageUrl = new Long(1234);
        createdRequest.setImageMediaID(modifiedImageUrl);
        Request updatedRequest = requestService.update(createdRequest);

        // assert all values correctly stored
        assertTrue("Party updated successfully", testHelper.equalRequests(updatedRequest, createdRequest));
        assertNotNull("id not null", updatedRequest.getId());
        assertTrue("id not 0", updatedRequest.getId() > 0);
    }

    @Test
    public void testDeleteRequest() throws Exception {
        Party party = persistDefaultParty(testHelper, partyService);

        Request testRequest = testHelper.getTestRequest1(party);
        Request createdRequest = requestService.create(testRequest);

        Request deletedRequest = requestService.delete(createdRequest.getId());

        // assert all values correctly stored
        // assertTrue("Request deleted successfully", testHelper.equalRequests(deletedRequest, testRequest));

        // assert that request is not existing anymore
        List<Request> lists = requestService.getAllPartyRequests(party.getId());
        assertEquals("no Request found", 0, lists.size());
    }

    private Party persistDefaultParty(TestHelper testHelper, PartyService partyService) {
        Party testParty = testHelper.getTestParty1();
        Party createdParty = partyService.create(testParty);
        return  createdParty;
    }

}