package de.konfetti.service;

import de.konfetti.controller.TestHelper;
import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import de.konfetti.data.Request;
import de.konfetti.data.RequestRepository;
import de.konfetti.service.exception.ServiceException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;

import static org.mockito.Mockito.when;

/**
 * Created by catarata02 on 08.11.15.
 */
@RunWith(MockitoJUnitRunner.class)
public class RequestServiceImplTestUnit {

    @Mock
    private PartyRepository partyRepository;
    @Mock
    private RequestRepository requestRepository;

    private TestHelper testHelper;

    @Before
    public void setUp() throws Exception {
        testHelper = new TestHelper();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testCreateWithoutValidParty() throws Exception {
        Party testParty1 = testHelper.getTestParty1();
        testParty1.setId((long) 10);
    }

    @Test(expected = ServiceException.class)
    public void testCreateWithRequestIdSet() throws Exception {
        Party testParty1 = testHelper.getTestParty1();
        testParty1.setId((long) 10);
        when(partyRepository.findOne(testParty1.getId())).thenReturn(testParty1);
        Request testRequest1 = testHelper.getTestRequest1(testParty1);
        testRequest1.setId((long) 1);
    }

}