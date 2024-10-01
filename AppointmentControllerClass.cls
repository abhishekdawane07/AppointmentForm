public class AppointmentControllerClass {

   @AuraEnabled
public static void insertAppointDetails(Id contactRecord, String subject, Date dateRecord, String timeRecord, String description) {
    // Ensure proper conversion from string to Time
    try {
        Time appointmentTime = convertToApexTime(timeRecord);

        // Check for empty or null parameters
        if (contactRecord != null && !String.isBlank(subject) && dateRecord != null && !String.isBlank(timeRecord) && !String.isBlank(description)) {
            
            // Create a new Appointment_Details__c record
            Appointment_Details__c app = new Appointment_Details__c();
            app.Contact__c = contactRecord;
            app.Subject__c = subject;
            app.Appointment_Date__c = dateRecord;
            app.Appointment_Time__c = appointmentTime; // Use the converted Time variable
            app.Description__c = description;

            // Insert the Appointment_Details__c record
            insert app;

        }
    } catch (Exception e) {
        // Catch block to handle any exception and return an error message
        System.debug('Error occurred: ' + e.getMessage());
        
    }
}
    
 @AuraEnabled
    public static List<Appointment_Details__c> checkDuplicateAppointment(Date selectedDate, String selectedTime) {
          if (selectedDate != null && !String.isEmpty(selectedTime)) {
        try {
            // Convert string to Time
            Time appointmentTime = convertToApexTime(selectedTime); 
            
            // Query to check if there's an appointment with the same Date and Time
            List<Appointment_Details__c> existingAppointments = [
                SELECT Id, Appointment_Date__c, Appointment_Time__c
                FROM Appointment_Details__c
                WHERE Appointment_Date__c = :selectedDate 
                AND Appointment_Time__c = :appointmentTime
            ];
            
            return existingAppointments; // Return existing appointments if found
            
        } catch (Exception ex) {
            // Handle any exceptions that occur during processing
            throw new AuraHandledException('Error occurred while checking for duplicate appointments: ' + ex.getMessage());
        }
    } else {
        // Handle case when inputs are not valid
        throw new AuraHandledException('Both Date and Time must be provided.');
    }
    }
    
    @AuraEnabled
    public static List<Appointment_Slots__c> fetchAvailableAppointments(Date selectedDate,string selectedTime) {
        system.debug('selectedTime=:'+selectedTime);
        
        try {
            Time appointmentTime = convertToApexTime(selectedTime);
            List<Appointment_Slots__c> avaiSlot = [SELECT Id, Name, Appointment_Date__c, Start_Time__c, End_Time__c 
                                                   FROM Appointment_Slots__c 
                                                   WHERE isActive__c = true 
                                                   AND Appointment_Date__c = :selectedDate  And Start_Time__c=:appointmentTime];
            system.debug('avaiSlot=:'+avaiSlot);
            return avaiSlot;
            
        } catch (Exception e) {
            System.debug('Error occurred: ' + e.getMessage());
            throw new AuraHandledException('Error occurred while fetching appointment slots.');
        }
    }
    
    private static Time convertToApexTime(String timeString) {
        // Ensure the input is in the correct format (e.g., "3:30 AM" or "3:30 PM")
        if (String.isBlank(timeString)) {
            throw new IllegalArgumentException('Time string cannot be empty');
        }
        
        // Split the input string to extract time and AM/PM
        String[] parts = timeString.split(' ');
        String timePart = parts[0]; // e.g., "3:30"
        String amPmPart = parts[1];  // e.g., "AM" or "PM"
        
        // Split the time part into hours and minutes
        String[] timeComponents = timePart.split(':');
        Integer hours = Integer.valueOf(timeComponents[0]);
        Integer minutes = Integer.valueOf(timeComponents[1]);
        
        // Adjust the hour based on AM/PM
        if (amPmPart.equalsIgnoreCase('PM') && hours < 12) {
            hours += 12; // Convert to 24-hour format
        } else if (amPmPart.equalsIgnoreCase('AM') && hours == 12) {
            hours = 0; // Midnight case
        }
        
        // Create the Time object
        return Time.newInstance(hours, minutes, 0, 0); // Seconds set to 0
          // Create the Time object
    }

}