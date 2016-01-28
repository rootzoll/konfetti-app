package de.konfetti.utils;

import java.util.Arrays;

public class Helper {

    public static <T> T nonnull(T value) {
        if (value == null) {
            throwIAE();
        }
        return value;
    }
    
    private static void throwIAE() {
        throw new IllegalArgumentException();
    }
    
    // calculate the distance between two GPS coordinates in meters
	public static double distInMeters(double lat1, double lng1, double lat2, double lng2) {
	    double earthRadius = 3958.75;
	    double dLat = Math.toRadians(lat2-lat1);
	    double dLng = Math.toRadians(lng2-lng1);
	    double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	               Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
	               Math.sin(dLng/2) * Math.sin(dLng/2);
	    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	    double dist = earthRadius * c;
	    int meterConversion = 1609;
	    double meters = Math.floor(dist * meterConversion);
	    return meters;
	}
	
	// append a value to an array
    public static <T> T[] append(T[] arr, T element) {
        final int N = arr.length;
        arr = Arrays.copyOf(arr, N + 1);
        arr[N] = element;
        return arr;
    }
    
    // check if value is in array
    public static <T> boolean contains(final T[] array, final T v) {
        for (final T e : array)
            if (e == v || v != null && v.equals(e))
                return true;

        return false;
    }
}
