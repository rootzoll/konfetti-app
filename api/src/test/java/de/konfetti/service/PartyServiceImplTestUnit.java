package de.konfetti.service;

import de.konfetti.controller.TestHelper;
import de.konfetti.data.*;
import de.konfetti.service.exception.ServiceException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;

/**
 * Created by catarata02 on 08.11.15.
 */
@RunWith(MockitoJUnitRunner.class)
public class PartyServiceImplTestUnit {

    @Mock
    private PartyRepository partyRepository;

    private TestHelper testHelper;

    private PartyService partyService;

    @Before
    public void setUp() throws Exception {
        partyService = new PartyServiceImpl(partyRepository);
        testHelper = new TestHelper();
    }

    @Test(expected = ServiceException.class)
    public void testCreateWithId() throws Exception {
        Party testParty1 = testHelper.getTestParty1();
        testParty1.setId((long) 10);
        partyService.create(testParty1);
    }
}