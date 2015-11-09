package de.konfetti.service;

import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import de.konfetti.service.exception.ServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotNull;
import java.util.List;

import static de.konfetti.utils.Helper.nonnull;

/**
 * Created by catarata02 on 08.11.15.
 */
@Service
@Validated
public class PartyServiceImpl extends BaseService implements PartyService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PartyServiceImpl.class);

    @Autowired
    public PartyServiceImpl(PartyRepository partyRepository) {
        this.partyRepository = partyRepository;
    }


    @Override
    public Party create(@NotNull Party party) {
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
        nonnull(party);

        Party dbParty = getPartyOrThrowError(party.getId());

        // update the fields TODO: could be done with entityManager merge??
        dbParty.setName(party.getName());
        dbParty.setAddress(party.getAddress());
        dbParty.setLon(party.getLon());
        dbParty.setLat(party.getLat());

        return partyRepository.saveAndFlush(dbParty);
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
        return partyRepository.findAll();
    }

    @Override
    public Party findById(long partyId) {
        return partyRepository.findOne(partyId);
    }


}
