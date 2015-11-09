package de.konfetti.utils;

/**
 * Created by catarata02 on 01.11.15.
 */
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
}
