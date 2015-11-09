package de.konfetti.service;

import de.konfetti.data.Request;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * Created by catarata02 on 08.11.15.
 */
public interface RequestService {

    Request create(@NotNull long partyId, @NotNull Request request);

    Request update(@NotNull long partyId, @NotNull Request request);

    Request delete(@NotNull long partyId, @NotNull long requestId);

    Request get(@NotNull long partyId, @NotNull long requestId);

    List<Request> getAllPartyRequests(@NotNull long partyId);

    Request findById(long requestId);
}