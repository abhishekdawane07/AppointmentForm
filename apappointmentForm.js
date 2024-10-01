import { LightningElement,wire } from 'lwc';
import insertAppointDetails from '@salesforce/apex/AppointmentControllerClass.insertAppointDetails';
import fetchAvailableAppointments from '@salesforce/apex/AppointmentControllerClass.fetchAvailableAppointments';
import checkDuplicateAppointment from '@salesforce/apex/AppointmentControllerClass.checkDuplicateAppointment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns=[
    {label: 'Appointment Slots Name', fieldName: 'Name' },
    {label: 'Appointment Date', fieldName: 'Appointment_Date__c' },
    {label: 'Start Time', fieldName: 'Start_Time__c' },
    {label: 'End Time', fieldName: 'End_Time__c' }]

export default class AppointmentForm extends LightningElement {
    contact='';
    subject='';
    Date='';
    Time='';
    Description='';
    columns=columns;
    availableSlots=[];

    isAvailableSlot=false;
    dublicateAppointment=[];

    
    handleContact(event) {
        this.contact = event.target.value;
        console.log('Contact:', this.contact);
       
        
    }

    handleSubject(event) {
        this.subject = event.target.value;
        console.log('Subject:', this.subject);
    }

    handleDate(event) {
        this.Date = event.target.value;
        console.log('Appointment Date:', this.Date );
    }

 

    // new method for to get time logic
    handleTime(event) {
        const timeValue = event.target.value; // Get the input value (e.g., "01:30")
        this.Time = this.convertTo12HourFormat(timeValue); // Convert to 12-hour format
        console.log('Appointment Time:', this.Time); // Output should be "1:30 AM"
    }
    
    convertTo12HourFormat(timeString) {
        // Split the time into hours and minutes
        const [hours, minutes] = timeString.split(':');
    
        // Convert the hour from string to integer
        let hour = parseInt(hours, 10);
    
        // Determine AM/PM
        const modifier = hour >= 12 ? 'pm' : 'am';
    
        // Convert to 12-hour format
        hour = hour % 12 || 12; // Change hour 0 to 12
    
        // Format the time as h:mm AM/PM
        return `${hour}:${minutes} ${modifier}`;
    }
        //========================================

    handleDescription(event) {
        this.Description = event.target.value;
        console.log('Description:',this.Description);
    }

    
    fetchAvailableSlots(){
        fetchAvailableAppointments({ selectedDate: this.Date,selectedTime: this.Time})
            .then(result => {
                this.availableSlots = result;
                this.isAvailableSlot=true;
                
                console.log('Available Slot=:'+JSON.stringify(this.availableSlots));
                if(this.availableSlots.length >0){
                    this.showToast('Success', 'Slots are available for the selected date.', 'Success');
                }
                else if (this.availableSlots.length === 0) {
                this.showToast('Error', 'No slots are available for the selected date.', 'error');
                
                }
            })
            .catch(error => {
                this.showToast('Error', 'Failed to fetch available slots.', 'error');
                this.isAvailableSlot = false;
            });
    }

    handleBookAppointment() {
        // Validate that all fields are filled
        if (!this.contact || !this.subject || !this.Date || !this.Time || !this.Description) {
            this.showToast('Error', 'All fields are required', 'error');
            return;
        }
    
        // Fetch available slots first to check if the selected date/time is available
        fetchAvailableAppointments({ selectedDate: this.Date, selectedTime: this.Time })
            .then(result => {
                this.availableSlots = result;
    
                // Check if no available slots were found for the selected date/time
                if (this.availableSlots.length === 0) {
                    this.showToast('Error', 'No available slots for the selected date and time. Please choose a different time.', 'error');
                    return; // Stop further processing
                }
    
                // Proceed with duplicate appointment check if slot is available
                checkDuplicateAppointment({ selectedDate: this.Date, selectedTime: this.Time })
                    .then(result => {
                        this.dublicateAppointment = result;
                        
                        if (this.dublicateAppointment.length > 0) {
                            this.showToast('Error', 'Duplicate Appointment Slots Not Allowed', 'error');
                        } else {
                            // Proceed with inserting appointment details
                            insertAppointDetails({
                                contactRecord: this.contact,
                                subject: this.subject,
                                dateRecord: this.Date,
                                timeRecord: this.Time,
                                description: this.Description
                            })
                            .then(() => {
                                this.showToast('Success', 'Appointment saved successfully', 'success');
                                this.resetForm(); // Reset form on success
                            })
                            .catch(error => {
                                console.error('Error saving appointment:', error.body.message);
                                this.showToast('Error', 'Failed to save appointment', 'error');
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error checking duplicates:', error.body.message);
                        this.showToast('Error', 'Failed to validate appointment', 'error');
                    });
            })
            .catch(error => {
                console.error('Error fetching available slots:', error.body.message);
                this.showToast('Error', 'Failed to check available slots', 'error');
            });
    }
    

    showToast(title, message, variant){
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

resetForm() {
    // Reset all lightning-input-field components inside lightning-record-edit-form
    const inputFields = this.template.querySelectorAll('lightning-input-field');
    if (inputFields) {
        inputFields.forEach(field => {
            field.reset(); // Resets each lightning-input-field
        });
    }

    // Reset all custom lightning-input fields (like Subject, Date, Time, and Description)
    const lightningInputs = this.template.querySelectorAll('lightning-input');
    if (lightningInputs) {
        lightningInputs.forEach(input => {
            input.value = ''; // Clear the value of each input
        });
    }
// Reset all lightning-input-field components inside lightning-record-edit-form
const inputTextAreaFields = this.template.querySelectorAll('lightning-textarea');
if (inputTextAreaFields) {
    inputTextAreaFields.forEach(field => {
        field.value = ''; // Resets each lightning-input-field
    });
}
    // Reset JavaScript variables
    this.contact = '';
    this.subject = '';
    this.Date = '';
    this.Time = '';
    this.Description = '';

    console.log('Form reset successfully');
}

}
