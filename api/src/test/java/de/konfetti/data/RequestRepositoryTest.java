package de.konfetti.data;

import de.konfetti.service.BaseTest;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.Assert.*;

/**
 * Created by relampago on 12.06.16.
 */
public class RequestRepositoryTest extends BaseTest {

    @Autowired
    private RequestRepository requestRepository;

    @Test
    public void findByPartyId() throws Exception {
        Long partyIdOne = new Long(1l);
        Long partyIdTwo = new Long(2l);
        creatRequest(partyIdOne);
        creatRequest(partyIdTwo);
        List<Request> foundRequests = requestRepository.findByPartyId(partyIdOne);
        assertEquals("found one party request", 1, foundRequests.size());
    }

    private void creatRequest(Long partyId){
        Request request = new Request();
        request.setPartyId(partyId);
        requestRepository.save(request);
    }

}