package de.konfetti.controller;

import de.konfetti.data.Party;
import de.konfetti.data.Request;
import de.konfetti.service.PartyService;
import de.konfetti.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.io.UnsupportedEncodingException;
import java.security.NoSuchAlgorithmException;
import java.util.List;

/**
 * Created by catarata02 on 08.11.15.
 */
@RestController
@RequestMapping("konfetti/api/party")
public class PartyController {

    private final PartyService partyService;

    private final RequestService requestService;

    @Autowired
    public PartyController(final PartyService partyService, RequestService requestService) {
        this.partyService = partyService;
        this.requestService = requestService;
    }

    //---------------------------------------------------
    // PARTY Controller
    //---------------------------------------------------

    @RequestMapping(method = RequestMethod.POST)
    public Party createListe(@RequestBody @Valid final Party party) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        return partyService.create(party);
    }

    @RequestMapping(method = RequestMethod.PUT)
    public Party updateListe(@RequestBody @Valid final Party party) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        return partyService.update(party);
    }

    @RequestMapping(value="/{partyId}", method = RequestMethod.DELETE)
    public boolean deleteParty(@PathVariable long partyId) {
        Party deletedParty = partyService.delete(partyId);
        return true;
    }

    @RequestMapping(value="/{partyId}", method = RequestMethod.GET)
    public Party getParty(@PathVariable long partyId) {
        return partyService.findById(partyId);
    }

    @RequestMapping(method = RequestMethod.GET)
    public List<Party> getAllParties() throws NoSuchAlgorithmException, UnsupportedEncodingException {
        return partyService.getAllParties();
    }

    //---------------------------------------------------
    // REQUEST Controller
    //---------------------------------------------------
    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.POST)
    public Request createRequest(@PathVariable long partyId, @RequestBody @Valid final Request request){
        return requestService.create(partyId, request);
    }

    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.PUT)
    public Request updateRequest(@PathVariable long partyId, @RequestBody @Valid Request request){
        return requestService.update(partyId, request);
    }

    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.DELETE)
    public Request deleteRequest(@PathVariable long partyId, @RequestBody @Valid Request request){
        return requestService.delete(partyId, request.getId());
    }

    @RequestMapping(value = "/{partyId}/request/{requestId}", method = RequestMethod.GET)
    public Request getRequest(@PathVariable long partyId, @RequestBody @Valid Request request){
        return requestService.get(partyId, request.getId());
    }

    @RequestMapping(value = "/{partyId}/request", method = RequestMethod.GET)
    public List<Request> getAllPartyRequests(@PathVariable long partyId){
        return requestService.getAllPartyRequests(partyId);
    }



    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    @ResponseBody
    public String handleResourceNotFoundException(ResourceNotFoundException ex)
    {
        return ex.getMessage();
    }

}
