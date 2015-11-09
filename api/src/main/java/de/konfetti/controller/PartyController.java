package de.konfetti.controller;

import de.konfetti.data.Party;
import de.konfetti.service.PartyService;
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

    @Autowired
    public PartyController(final PartyService partyService) {
        this.partyService = partyService;
    }

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

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    @ResponseBody
    public String handleResourceNotFoundException(ResourceNotFoundException ex)
    {
        return ex.getMessage();
    }

}
