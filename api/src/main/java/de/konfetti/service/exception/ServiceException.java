package de.konfetti.service.exception;

public class ServiceException extends RuntimeException {

    public ServiceException(final String message) {
        super(message);
    }
}
