package de.konfetti.service;

import de.konfetti.Application;
import de.konfetti.controller.TestHelper;
import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Created by catarata02 on 08.11.15.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@ActiveProfiles("test")
public class PartyServiceImplTestIt {

    private final TestHelper testHelper = new TestHelper();

    @Autowired
    private PartyRepository partyRepository;

    private PartyService partyService;

    @Before
    public void setUp() throws Exception {
        partyService = new PartyServiceImpl(partyRepository);

        partyRepository.deleteAll();
    }

    @Test
    public void testCreateParty() throws Exception {
        Party testParty = testHelper.getTestParty1();
        Party createdParty = partyService.create(testParty);

        // assert all values correctly stored
        assertTrue("Party created successfully", testHelper.equalPartys(testParty, createdParty));
        assertNotNull("id not null", createdParty.getId());
        assertTrue("id not 0", createdParty.getId() > 0);
    }

    @Test
    public void testUpdateParty() throws Exception {
        Party testParty = partyService.create(testHelper.getTestParty1());
        String modiefiedName = "modiefiedName";
        testParty.setName(modiefiedName);
        String modifiedAddress = "modifiedAddress";
        testParty.setAddress(modifiedAddress);
        Party modfiedParty = partyService.update(testParty);

        // assert all values correctly stored
        assertTrue("Party updated successfully", testHelper.equalPartys(modfiedParty, testParty));
        assertNotNull("id not null", modfiedParty.getId());
        assertTrue("id not 0", modfiedParty.getId() > 0);
    }

    @Test
    public void testDeleteParty() throws Exception {
        Party testParty = partyService.create(testHelper.getTestParty1());
        Party deletedParty = partyService.delete(testParty.getId());

        // assert all values correctly stored
        assertTrue("Party deleted successfully", testHelper.equalPartys(deletedParty, testParty));

        // assert that list is not existing anymore
        List<Party> lists = partyService.getAllParties();
        assertEquals("no list found", 0, lists.size());
    }

}