package de.konfetti.data;

/**
 * Created by catarata02 on 09.11.15.
 */
public enum  RequestState {

    OPEN("open"), REJECTED("rejected");

    private String statusCode;

	RequestState(String s) {
		statusCode = s;
    }

    public String getStatusCode() {
        return statusCode;
    }

}
