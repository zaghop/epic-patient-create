import { LightningElement, api, wire, track } from "lwc";
import { updateRecord } from "lightning/uiRecordApi";
import getAccount from "@salesforce/apex/BridgeEpicPatientCreate.getAccount";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import checkAdmin from '@salesforce/apex/BridgeEpicPatientCreate.isAdmin';
import getSettings from "@salesforce/apex/BridgeEpicPatientCreate.getSettings";
import sendPatientToApex from '@salesforce/apex/BridgeEpicPatientCreate.sendPatient';
import userId from '@salesforce/user/Id';
import EPIC_ID_FIELD from "@salesforce/schema/Account.Epic_Id__c";
import EPIC_MRN_FIELD from "@salesforce/schema/Account.Epic_MRN__c";
import ID_FIELD from "@salesforce/schema/Account.Id";
import SEND_DATE_FIELD from "@salesforce/schema/Account.Last_Epic_Send_Date__c";
import SEND_USER_FIELD from "@salesforce/schema/Account.Last_Epic_Send_User__c";

const regexp = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;
const states2 = ['AL',
'AK',
'AS',
'AZ',
'AR',
'CA',
'CO',
'CT',
'DE',
'DC',
'FM',
'FL',
'GA',
'GU',
'HI',
'ID',
'IL',
'IN',
'IA',
'KS',
'KY',
'LA',
'ME',
'MH',
'MD',
'MA',
'MI',
'MN',
'MS',
'MO',
'MT',
'NE',
'NV',
'NH',
'NJ',
'NM',
'NY',
'NC',
'ND',
'MP',
'OH',
'OK',
'OR',
'PW',
'PA',
'PR',
'RI',
'SC',
'SD',
'TN',
'TX',
'UT',
'VT',
'VI',
'VA',
'WA',
'WV',
'WI',
'WY'];
const states = ['alabama',
                'alaska',
                'american samoa',
                'arizona',
                'arkansas',
                'california',
                'colorado',
                'connecticut',
                'delaware',
                'district of columbia',
                'federated states of micronesia',
                'florida',
                'georgia',
                'guam',
                'hawaii',
                'idaho',
                'illinois',
                'indiana',
                'iowa', 
                'kansas',
                'kentucky',
                'louisiana',
                'maine',
                'marshall islands',
                'maryland',
                'massachusetts',
                'michigan',
                'minnesota',
                'mississippi',
                'missouri',
                'montana',
                'nebraska',
                'nevada',
                'new hampshire',
                'new jersey',
                'new mexico',
                'new york',
                'north carolina',
                'north dakota',
                'northern mariana islands',
                'ohio',
                'oklahoma',
                'oregon',
                'palau',
                'pennsylvania',
                'puerto rico',
                'rhode island',
                'south carolina',
                'south dakota',
                'tennessee',
                'texas',
                'utah',
                'vermont',
                'virgin islands',
                'virginia',
                'washington',
                'west virginia',
                'wisconsin',
                'wyoming'];

export default class BridgeEpicPatientCreate extends LightningElement {
    @api recordId;
    @api objectApiName;
    @track hasEpicId = false;
    @track showSpinner = false;
    @track showSettingsButton = false;
    @track lastSendDate = '';
    @track lastSendUser = '';
    @track isAdmin = false;
    @track showSettings = false;
    @track showPreviewModal = false;
    @track showConfirmModal = false;
    @track settingsPrompt = false;
    @track missingReqFields = [];
    @track invalidFields = [];

    previewClicked;
    showLastCredentialSave;
    lastSaveDate;
    credentialsProvided;
    gender;
    homePhone;
    mobilePhone;
    workPhone;
    ssn;
    genericSSNs;
    defaultGenericSSN;
    genericPillArr = [];
    defaultGenericOptions = [];
    account;
    accountMap;
    dynamicFieldsArr = [];
    userFirstLastName;
    self = this;

    @wire(checkAdmin)
    getuserData({ data, error }) {
        if(data){
            if(data.isAdmin == 'true'){
                this.isAdmin = true;
                this.showSettingsButton = true;
            }
            this.userFirstLastName = data.name;
        }else if(error){
            this.showToast(
                "Error!",
                "There was an error retrieving user data. Please contact your administrator.",
                "error"
            );
        }
    }

    @wire(getSettings)
    displaySettings({error, data}){
        if(data){
            if(Object.entries(data).length === 0){
                this.settingsPrompt = true;
            }else{
                if(data.last_save_date){
                    this.lastSaveDate = data.last_save_date;
                    this.showLastCredentialSave = true;
                }
                this.credentialsProvided = data.credentialsProvided;
                this.genericSSNs = data.genericSSNs;
                this.gender = data.gender;
                this.homePhone = data.home_phone;
                this.mobilePhone = data.mobile_phone;
                this.workPhone = data.work_phone;
                this.ssn = data.ssn;
                this.dynamicFieldsArr = [this.gender,
                                            this.homePhone,
                                            this.mobilePhone,
                                            this.workPhone,
                                            this.ssn];
                this.initssnArrays();
                this.defaultGenericSSN = data.defaultGenericSSN;
                this.initPreview();
                this.getDynamicAccountFields();
            }
        }else if(error) {
            this.showSpinner = false;
            this.settingsPrompt = true;
        }
    }

    getDynamicAccountFields = () => {
        var self = this;

        getAccount({
            accountId: self.recordId,
            dynamicFields: self.dynamicFieldsArr
        })
            .then(result => {
                this.accountMap = result;
                if(this.accountMap["Last_Epic_Send_Date__c"] != undefined && this.accountMap["Last_Epic_Send_Date__c"] != null){
                    this.lastSendDate = this.formatDateTimeNoComma(this.accountMap["Last_Epic_Send_Date__c"]);
                }
                this.lastSendUser = this.accountMap["Last_Epic_Send_User"];
    
                if(!this.accountMap["Epic_MRN__c"]){
                    this.hasEpicId = false;
                }else{
                    this.hasEpicId = true;
                }

                this.showSpinner = false;
            }).catch(
            function (error) {
                this.showToast(
                    "Error!",
                    "There was an error retrieving account data. Please contact your administrator.",
                    "error"
                );
            });
    }

    initPreview = (event) => {
        this.settingsPrompt = false;
        if(typeof event === 'undefined'){
            this.dynamicFieldsArr = [this.gender,
                                     this.homePhone,
                                     this.mobilePhone,
                                     this.workPhone,
                                     this.ssn];
        }else{
            this.gender = event.detail.gender;
            this.ssn = event.detail.ssn;
            this.homePhone = event.detail.homePhone;
            this.mobilePhone = event.detail.mobilePhone;
            this.workPhone = event.detail.workPhone;
            this.dynamicFieldsArr = [event.detail.gender,
                                     event.detail.homePhone,
                                     event.detail.mobilePhone,
                                     event.detail.workPhone,
                                     event.detail.ssn];
        }
    }

    initssnArrays = () => {
        var noSpaces = this.genericSSNs.replace(/\s+/g, '');
        var numArray = noSpaces.split(',');
        var i;

        this.defaultGenericOptions = [];
        this.genericPillArr = [];

        for(i=0; i<numArray.length; i++){
            this.defaultGenericOptions[i] = {label: numArray[i], value: numArray[i]};
            this.genericPillArr[i] = { label: numArray[i], name: numArray[i] };
        }
    }

    showSettingsModal = () => {
        this.showSettings = true;
    }

    closeSettingsModal = () => {
        this.showSettings = false;
    }

    refreshSettings = (event) => {
        this.lastSaveDate = event.detail.last_save_date;
        this.showLastCredentialSave = true;
        this.gender = event.detail.gender;
        this.homePhone = event.detail.home_phone;
        this.mobilePhone = event.detail.mobile_phone;
        this.workPhone = event.detail.work_phone;
        this.ssn = event.detail.ssn;
        this.defaultGenericSSN = event.detail.defaultGenericSSN;
        this.genericSSNs = event.detail.genericSSNs;
        this.credentialsProvided = event.detail.credentialsProvided;
        this.initssnArrays();
    }

    closePreviewModal = () => {
        this.showPreviewModal = false;
        this.previewClicked = false;
    }

    closeConfirmModal = () => {
        this.showConfirmModal = false;
        if (this.previewClicked){
            this.showPreviewModal = true;
        }
    }

    previewModalClick = () => {
        this.showPreviewModal = true;
        this.previewClicked = true;
    }
    
    formValid = () =>{
        this.missingReqFields = [];
        if (this.accountMap["FirstName"] == null && this.accountMap["FirstName"] == undefined) {
            this.missingReqFields.push({id: 1, name:'FirstName'});
        }
        if (this.accountMap["LastName"] == null && this.accountMap["LastName"] == undefined){
            this.missingReqFields.push({id: 2, name:'LastName'});
        }
        if (this.accountMap["gender"] == null && this.accountMap["gender"] == undefined){
            this.missingReqFields.push({id: 3, name:'Gender'});
        }
        if (this.accountMap["PersonBirthdate"] == null && this.accountMap["PersonBirthdate"] == undefined){
            this.missingReqFields.push({id: 4, name:'Birthdate'});
        }
        if( !((this.accountMap["PersonEmail"] != null && this.accountMap["PersonEmail"] != undefined) ||
            (this.accountMap["ssn"] != null && this.accountMap["ssn"] != undefined) ||
            (this.accountMap["workPhone"] != null && this.accountMap["workPhone"] != undefined) ||
            (this.accountMap["homePhone"] != null && this.accountMap["homePhone"] != undefined) ||
            (this.accountMap["mobilePhone"] != null && this.accountMap["mobilePhone"] != undefined) ||
           ((this.accountMap["PersonMailingStreet"] != null && this.accountMap["PersonMailingStreet"] != undefined) &&
            (this.accountMap["PersonMailingCity"] != null && this.accountMap["PersonMailingCity"] != undefined) &&
            (this.accountMap["PersonMailingState"] != null && this.accountMap["PersonMailingState"] != undefined) &&
            (this.accountMap["PersonMailingPostalCode"] != null && this.accountMap["PersonMailingPostalCode"] != undefined) &&
            (this.accountMap["PersonMailingCountry"] != null && this.accountMap["PersonMailingCountry"] != undefined)))){
                this.missingReqFields.push({id: 5, name:'at least one of SSN; Email; Full Mailing Address; or Home, Mobile, or Work Phone'});
        }
        if(this.accountMap["ssn"] != null && this.accountMap["ssn"] != undefined){
            if(this.genericSSNs.includes(this.accountMap["ssn"])){
                let hasRequired = false;

                if(this.accountMap["PersonEmail"] != null && this.accountMap["PersonEmail"] != undefined){
                    hasRequired = true;
                }
                if((this.accountMap["workPhone"] != null && this.accountMap["workPhone"] != undefined) ||
                   (this.accountMap["homePhone"] != null && this.accountMap["homePhone"] != undefined) ||
                   (this.accountMap["mobilePhone"] != null && this.accountMap["mobilePhone"] != undefined)){
                    hasRequired = true;
                }
                if((this.accountMap["PersonMailingStreet"] != null && this.accountMap["PersonMailingStreet"] != undefined) &&
                   (this.accountMap["PersonMailingCity"] != null && this.accountMap["PersonMailingCity"] != undefined) &&
                   (this.accountMap["PersonMailingState"] != null && this.accountMap["PersonMailingState"] != undefined) &&
                   (this.accountMap["PersonMailingPostalCode"] != null && this.accountMap["PersonMailingPostalCode"] != undefined) &&
                   (this.accountMap["PersonMailingCountry"] != null && this.accountMap["PersonMailingCountry"] != undefined)){
                    hasRequired = true;
                }
                if(!hasRequired){
                    this.missingReqFields.push({id: 6, name:'at least one of Email; Full Mailing Address; Home, Mobile, or Work Phone; or a SSN that is not generic'});
                }
            }
        }

        if (this.missingReqFields.length > 0){
            return false;
        }else{
            return true;
        }
    }

    verifyInput = () =>{
        var phoneInvalid = false;
        var num = 0;
        this.invalidFields = [];
        if (this.accountMap["gender"] != null && this.accountMap["gender"] != undefined){
            if (this.accountMap["gender"].toLowerCase() != 'male' &&
                this.accountMap["gender"].toLowerCase() != 'female' &&
                this.accountMap["gender"].toLowerCase() != 'unknown'){
                this.invalidFields.push('Valid values for Gender are Male, Female, or Unknown');
            }
        }

        if (phoneInvalid == false && this.accountMap["workPhone"] != null && this.accountMap["workPhone"] != undefined){

            let str = this.accountMap["workPhone"];//"Rs. 6,67,000";
            let res = str.replace(/\D/g, "");
            if (res.length != 10 && res.length != 11){
                this.invalidFields.push('Valid values for Phone Numbers are US 10- or 11-digit numbers.')
                phoneInvalid = true;
            }
        }

        if (phoneInvalid == false && this.accountMap["homePhone"] != null && this.accountMap["homePhone"] != undefined){

            let str = this.accountMap["homePhone"];//"Rs. 6,67,000";
            let res = str.replace(/\D/g, "");
            if (res.length != 10 && res.length != 11){
                this.invalidFields.push('Valid values for Phone Numbers are US 10- or 11-digit numbers.')
                phoneInvalid = true;
            }
        }

        if (phoneInvalid == false && this.accountMap["mobilePhone"] != null && this.accountMap["mobilePhone"] != undefined){

            let str = this.accountMap["mobilePhone"];//"Rs. 6,67,000";
            let res = str.replace(/\D/g, "");
            if (res.length != 10 && res.length != 11){
                this.invalidFields.push('Valid values for Phone Numbers are US 10- or 11-digit numbers.')
                phoneInvalid = true;
            }
        }

        if (this.accountMap["ssn"] != null && this.accountMap["ssn"] != undefined){
            if (!regexp.test(this.accountMap["ssn"])){
                if (!regexp.test(this.addSSNHyphens(this.accountMap["ssn"]))){
                    this.invalidFields.push('SSN must be formatted as ########## or ###-##-####)');
                }
            }
        }

        if (this.accountMap["PersonMailingState"] != null && this.accountMap["PersonMailingState"] != undefined){
            if (!states2.includes(this.accountMap["PersonMailingState"].toUpperCase()) &&
                !states.includes(this.accountMap["PersonMailingState"].toLowerCase())){
                this.invalidFields.push('Mailing State must be a valid US state or two-letter abbreviation');
            }
        }
        
        if (this.accountMap["PersonMailingPostalCode"] != null && this.accountMap["PersonMailingPostalCode"] != undefined){
            if (isNaN(this.accountMap["PersonMailingPostalCode"].replace('-', '')) ||
               (this.accountMap["PersonMailingPostalCode"].length != 5 &&
                this.accountMap["PersonMailingPostalCode"].replace('-', '').length != 9)){
                this.invalidFields.push('Mailing Postal Code must be 5 or 9 digits and can contain hyphens');
            }
        }

        if (this.invalidFields.length > 0){
            return false;
        }else{
            return true;
        }
    }

    addSSNHyphens = (ssn) =>{
        return ssn.slice(0, 3) + "-" + ssn.slice(3,5) + "-" + ssn.slice(5,ssn.length);
    }

    confirmSubmission = () =>{
        var self = this; 

        if (this.showPreviewModal){
            this.showPreviewModal = false;
        }

        this.showSpinner = true;
        
        getAccount({
            accountId: self.recordId,
            dynamicFields: self.dynamicFieldsArr
        })
            .then(result => {
                this.accountMap = result;
                if(this.accountMap["Last_Epic_Send_Date__c"] != undefined && this.accountMap["Last_Epic_Send_Date__c"] != null){
                    this.lastSendDate = this.formatDateTimeNoComma(this.accountMap["Last_Epic_Send_Date__c"]);
                }
                this.lastSendUser = this.accountMap["Last_Epic_Send_User"];
    
                if(!this.accountMap["Epic_MRN__c"]){
                    this.hasEpicId = false;
                }else{
                    this.hasEpicId = true;
                }

                if (this.hasEpicId){
                    if (this.showPreviewModal){
                        this.showPreviewModal = false;
                    }
                    this.showConfirmModal = true;
                } else {
                    this.submissionConfirmed();
                }

                //this.showSpinner = false;
            }).catch(
            function (error) {
                this.showToast(
                    "Error!",
                    "There was an error retrieving account data. Please contact your administrator.",
                    "error"
                );
            });
    }

    submissionConfirmed = () =>{       
        getAccount({
            accountId: this.recordId,
            dynamicFields: this.dynamicFieldsArr
        })
            .then(result => {
                this.accountMap = result;
                if(this.accountMap["Last_Epic_Send_Date__c"] != undefined && this.accountMap["Last_Epic_Send_Date__c"] != null){
                    this.lastSendDate = this.formatDateTimeNoComma(this.accountMap["Last_Epic_Send_Date__c"]);
                }
                this.lastSendUser = this.accountMap["Last_Epic_Send_User"];
    
                if(!this.accountMap["Epic_MRN__c"]){
                    this.hasEpicId = false;
                }else{
                    this.hasEpicId = true;
                }

                if (this.formValid()){
                    if (this.verifyInput()){
                        this.sendPatientInfo();
                    }else{
                        let err = "The following inputs are invalid or not formatted correctly: ";

                        if (this.invalidFields.length > 0){
                            for (let i = 0; i < this.invalidFields.length; i++){
                                err += this.invalidFields[i];
                                err += (i < this.invalidFields.length - 1) ? "; " : ".";
                            }

                            this.showSpinner = false;
                            this.showToast(
                                "Error!",
                                err,
                                "error"
                            );
                        }
                    }
                }else{
                    let err = "The following attributes are required before sending data to your EMR: ";
                
                    if (this.missingReqFields.length > 0){
                        for (let i = 0; i < this.missingReqFields.length; i++){
                            err += this.missingReqFields[i].name;
                            err += (i < this.missingReqFields.length - 1) ? ", " : ".";
                        }

                        this.showSpinner = false;
                        this.showToast(
                            "Error!",
                            err,
                            "error"
                        );
                    }
                }

            }).catch(
            function (error) {
                this.showSpinner = false;
                this.showToast(
                    "Error!",
                    error,
                    "error"
                );
            });

    }

    formatDateTimeNoComma = (timeParam) => {
        var dateString = timeParam.split(' ')[0];
        var timeString = timeParam.split(' ')[1];
        var minutes = timeString.substr(3,2);
        var yearWithDash = dateString.substr(0,5);
        var year = yearWithDash.substr(0,4);
        var monthDay = dateString.substr(5,5);
        var month = monthDay.substr(0,2);
        var day = monthDay.substr(3,2);
        month = month.replace(/^0+/, '');
        day = day.replace(/^0+/, '');
        var formattedDateTime = month + '/' + day + '/' + year;
        var hour = timeString.substr(0,2);
        hour = hour.replace(/^0+/, '');

        if(hour>12){
            hour = hour - 12;
            formattedDateTime += ' at ' + hour + ':' + minutes + ' PM' ;
        }else{
            formattedDateTime += ' at ' + hour + ':' + minutes + ' AM' ;
        }

        return formattedDateTime;
    }

    formatDateTime = (timeParam) => {
        var strArr = timeParam.split(', ');
        var formattedTime = strArr[0] + ' at ' + strArr[1];
        return formattedTime;
    }

    sendPatientInfo = () => {
        var self = this;
        var genericSSN;

        this.showSpinner = true;
        this.showConfirmModal = false;
        this.previewClicked = false;

        let payload = {};
        
        if(this.accountMap["FirstName"] != null && this.accountMap["FirstName"] != undefined){
            payload.FirstName = this.accountMap["FirstName"];
        }
        if(this.accountMap["LastName"] != null && this.accountMap["LastName"] != undefined){
            payload.LastName = this.accountMap["LastName"];
        }
        if(this.accountMap["PersonEmail"] != null && this.accountMap["PersonEmail"] != undefined){
            payload.PersonEmail = this.accountMap["PersonEmail"];
        }
        if(this.accountMap["PersonBirthdate"] != null && this.accountMap["PersonBirthdate"] != undefined){
            payload.PersonBirthDate = this.accountMap["PersonBirthdate"];
        }
        if(this.accountMap["PersonMailingStreet"] != null && this.accountMap["PersonMailingStreet"] != undefined){
            payload.PersonMailingStreet = this.accountMap["PersonMailingStreet"];
        }
        if(this.accountMap["PersonMailingCity"] != null && this.accountMap["PersonMailingCity"] != undefined){
            payload.PersonMailingCity = this.accountMap["PersonMailingCity"];
        }
        if(this.accountMap["PersonMailingState"] != null && this.accountMap["PersonMailingState"] != undefined){
            payload.PersonMailingState = this.accountMap["PersonMailingState"];
        }
        if(this.accountMap["PersonMailingPostalCode"] != null && this.accountMap["PersonMailingPostalCode"] != undefined){
            payload.PersonMailingPostalCode = this.accountMap["PersonMailingPostalCode"];
        }
        if(this.accountMap["PersonMailingCountry"] != null && this.accountMap["PersonMailingCountry"] != undefined){
            payload.PersonMailingCountry = this.accountMap["PersonMailingCountry"];
        }
        if(this.accountMap["gender"] != null && this.accountMap["gender"] != undefined){
            payload.PersonGender = this.accountMap["gender"];
        }
        if(this.accountMap["homePhone"] != null && this.accountMap["homePhone"] != undefined){
            payload.PersonHomePhone = this.accountMap["homePhone"];
        }
        if(this.accountMap["mobilePhone"] != null && this.accountMap["mobilePhone"] != undefined){
            payload.PersonMobilePhone = this.accountMap["mobilePhone"];
        }
        if(this.accountMap["workPhone"] != null && this.accountMap["workPhone"] != undefined){
            payload.PersonWorkPhone = this.accountMap["workPhone"];
        }
        if(this.accountMap["ssn"] != null && this.accountMap["ssn"] != undefined){
            let ssn = this.accountMap["ssn"];
            if (ssn.length < 11){
                ssn = this.addSSNHyphens(ssn);
            }
            payload.SSN = ssn;
            payload.IsGenericSSN = "false";

            if(this.genericSSNs.includes(payload.SSN)){
                payload.IsGenericSSN = "true";
            }

        }else{
            payload.SSN = this.defaultGenericSSN;
            payload.IsGenericSSN = "true";
        }

        // send payload to Apex for callout
        sendPatientToApex({
            payload: payload
        })
            .then(result => {
                var response = JSON.parse(result);
                var responseCode = parseInt(response.statusCode);
                self.showSpinner = false;
                if(responseCode == 200){
                    self.handle200(response);
                }else{
                    self.handleOtherResponses(response, responseCode);
                }
            }).catch(
                function (error) {
                    self.showSpinner = false;
                    self.showToast(
                        "Error!",
                        "There was an error sending patient to Apex. Please contact your administrator.",
                        "error"
                    );
                });
    } // end sendPatientInfo()

    
    handle200 = (response) => {
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[EPIC_ID_FIELD.fieldApiName] = response.EPICid;
        fields[EPIC_MRN_FIELD.fieldApiName] = response.MRN;
        fields[SEND_DATE_FIELD.fieldApiName] = new Date().toISOString();
        fields[SEND_USER_FIELD.fieldApiName] = userId;
        const recordInput = { fields };

        //200 indicates a new patient has been created or a single match was found
        if (response.uniqueRecord == 'true' && response.newPatientCreated == 'true'){
            updateRecord(recordInput)
            .then(result => {
                if(result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue != null && 
                    result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue != undefined){
                    this.lastSendDate = this.formatDateTime(result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue);
                }
                this.lastSendUser = this.userFirstLastName;
                this.hasEpicId = true;
                this.showSpinner = false;
                this.showToast(
                    "Success!",
                    "The patient has been created in your EMR and the MRN value has been updated.",
                    "success"
                );
                this.showPreviewModal = false;
            })
            .catch(error => {
                this.showSpinner = false;
                this.showToast(
                    "Error!",
                    "The patient has been created in your EMR, but an error occurred updating the MRN value in Salesforce. Please contact your Salesforce Administrator.",
                    "error"
                );
            });
        }else if (response.uniqueRecord == 'true' && response.newPatientCreated == 'false'){
            updateRecord(recordInput)
            .then(result => {
                if(result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue != null && 
                    result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue != undefined){
                    this.lastSendDate = this.formatDateTime(result.fields.epicpackaging__Last_Epic_Send_Date__c.displayValue);
                }
                this.lastSendUser = this.userFirstLastName;
                this.hasEpicId = true;
                this.showSpinner = false;
                this.showToast(
                    "Alert!",
                    "The patient matches an existing record in your EMR and the MRN value has been updated.",
                    "warning"
                );
                this.showPreviewModal = false;
            })
            .catch(error => {
                this.showSpinner = false;
                this.showToast(
                    "Error!",
                    "The patient matches an existing record in your EMR, but an error occurred updating the MRN value in Salesforce. Please contact your Salesforce Administrator.",
                    "error"
                );
            });
        }
    } // end handle200()

    handleOtherResponses = (response, responseCode) => {
        if (responseCode == 300){
            //300 indicates the demographics in the payload matched to multiple patients in the EMR
            this.showSpinner = false;
            this.showToast(
                "Alert!",
                "This patient matches multiple existing records in your EMR. Please review the patient data and provide additional attributes to uniquely identify this patient.",
                "warning"
            );
        }else if (responseCode == 400){
            //400 indicates an existing patient has been found
            var EPICid = JSON.parse(response.EPICid);
            var rawResponse = EPICid.rawResponse;
            var issueArr;
            if(rawResponse.issue){
                issueArr = rawResponse.issue;
            }
            var issueMessageArr = [];
            if(issueArr != undefined && issueArr.length > 0){
                var i;
                for(i=0; i<issueArr.length; i++){
                    if(issueArr[i].severity == "fatal"){
                        issueMessageArr.push(issueArr[i].diagnostics);
                    }
                }
            }
            if(issueMessageArr.length > 0){
                var errorString = '';
                var i;
                for(i=0; i<issueMessageArr.length; i++){
                    errorString += issueMessageArr[i];
                    if(i + 1 == issueMessageArr.length){
                        errorString += '.';
                    }else if(i + 1 < issueMessageArr.length){
                        errorString += '; ';
                    }
                }
                this.showSpinner = false;
                this.showToast(
                    "Error!",
                    "The following errors were sent back from your EMR: " + errorString,
                    "error"
                );
            }else{
                this.showSpinner = false;
                this.showToast(
                    "Error!",
                    "There was an error sending data to your EMR. Please contact your Salesforce Administrator.",
                    "error"
                );
            }
        }else if (responseCode == 401){
            //401 indicates credentials were invalid
            this.showSpinner = false;
            this.showToast(
                "Error!",
                "EMR credentials are invalid. Please re-enter in settings, or contact your Salesforce Administrator.",
                "error"
            );
        } else {
            this.showSpinner = false;
            this.showToast(
                "Error!",
                "There was an error sending data to your EMR. Please contact your Salesforce Administrator.",
                "error"
            );
        }
    }

    showToast = (title, message, variant) => {
        const evt = new ShowToastEvent({
          title: title,
          message: message,
          variant: variant,
          mode: 'sticky'
        });
        this.dispatchEvent(evt);
    };
}