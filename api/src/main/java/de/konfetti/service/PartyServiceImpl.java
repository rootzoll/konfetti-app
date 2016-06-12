package de.konfetti.service;

import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import de.konfetti.service.exception.ServiceException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

import static de.konfetti.utils.Helper.nonnull;

@Service
@Validated
public class PartyServiceImpl extends BaseService implements PartyService {

    @Autowired
    public PartyServiceImpl(PartyRepository partyRepository) {
        this.partyRepository = partyRepository;
    }

    @Override
    public Party create(@NotNull Party party) {
    	
    	// check input
        nonnull(party);

        Long partyId = party.getId();
        if (partyId != null && partyId > 0) {
            throw new ServiceException(
                    String.format("The id cannot be set for create party"));
        }

        party.setId(null);

        return partyRepository.saveAndFlush(party);
    }

    @Override
    public Party update(@NotNull Party party) {
        return partyRepository.saveAndFlush(party);
    }

    @Override
    public Party delete(long listId) {
    	
        // make sure the list exists
        Party dbParty = partyRepository.findOne(listId);
        if (dbParty == null) {
            // we suppose the party was delete before, all okay
            return null;
        }

        partyRepository.delete(dbParty.getId());
        partyRepository.flush();
        return dbParty;
    }


    @Override
    public List<Party> getAllParties() {
        List<Party> parties = partyRepository.findAll();
        // filter out deactivated parties
        List<Party> result = new ArrayList<Party>();
        for (Party party : parties) {
			if (party.getVisibility()>=0) result.add(party);
		}
        return result;
    }

    @Override
    public Party findById(long partyId) {
        return partyRepository.findOne(partyId);
    }

    @Override
    public Party findByName(String name) {
        return (Party) partyRepository.findByName(name);
    }

    // TODO improve performance
    @Override
    public Long getNumberOfParties() {
        return (long) partyRepository.findAll().size();
    }


}
