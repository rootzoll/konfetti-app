package de.konfetti;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import de.konfetti.utils.Helper;

@SpringBootApplication
@Configuration
@EnableConfigurationProperties
@EnableScheduling
public class Application extends SpringBootServletInitializer {

    public static void main(String[] args) {
    	
    	String propertyFileVersionNeeded = "2";
    	String propertyFileVersion = Helper.getPropValues("konfetti.propertiesVersion");
    	if (!propertyFileVersionNeeded.equals(propertyFileVersion)) {
    		throw new RuntimeException("Properties files 'src/main/resources/application.properties' seems out of date - verson is("+propertyFileVersion+") needed("+propertyFileVersionNeeded+")- compare properties with latest from github.");
    	}
        SpringApplication.run(Application.class, args);
    }

    @Override
    protected final SpringApplicationBuilder configure(final SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }
}
