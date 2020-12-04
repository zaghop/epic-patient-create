import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { loadStyle } from 'lightning/platformResourceLoader';
import cssResource from '@salesforce/resourceUrl/Epic_styles'
import saveSetApex from "@salesforce/apex/BridgeEpicPatientCreate.saveSettings";
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
const STATIC_ACCOUNT_FIELDS = [ 'Id',
                                'FirstName',
                                'LastName',
                                'PersonEmail',
                                'PersonBirthdate',
                                'PersonMailingStreet',
                                'PersonMailingCity',
                                'PersonMailingState',
                                'PersonMailingPostalCode',
                                'PersonMailingCountry',
                                'Epic_ID__c',
                                'Epic_MRN__c',
                                'Last_Epic_Send_Date__c',
                                'Last_Epic_Send_User__c'];

export default class BridgeEpicPatientCreateSettings extends LightningElement {

    @track showDeletePill = false;
    @track showErrorMessage = false;
    @track showEnterGenericMessage = false;
    @track showSelectDefaultGeneric = true;
    @track defaultGenericOptionsArray;
    @track accountFieldOptions;
    @track pillArr;
    @track newSSN;
    @track clickedPillSSN;
    @track clickedPillIndex;
    @api showLastCredentialSave;
    @api lastSaveDate;
    @api credentialsProvided;
    @api gender;
    @api homePhone;
    @api mobilePhone;
    @api workPhone;
    @api username;
    @api password;
    @api client_id;
    @api ssn;
    @api defaultGenericSSN;
    @api defaultGenericOptions;
    @api genericPillArr;
    @api genericSSNs;

    settings = {};
    errorMessage;
    firstRender = true;

    renderedCallback(){
        if(this.firstRender){
            this.settings = {};

            if(this.defaultGenericSSN != undefined && this.defaultGenericSSN != "" && this.defaultGenericSSN != null){
                this.settings["defaultGenericSSN"] = this.defaultGenericSSN;
            }
            if(this.gender != undefined && this.gender != "" && this.gender != null){
                this.settings["gender"] = this.gender;
            }
            if(this.ssn != undefined && this.ssn != "" && this.ssn != null){
                this.settings["ssn"] = this.ssn;
            }
            if(this.genericSSNs != undefined && this.genericSSNs != "" && this.genericSSNs != null){
                this.settings["genericSSNs"] = this.genericSSNs;
            }
            if(this.homePhone != undefined && this.homePhone != "" && this.homePhone != null){
                this.settings["home_phone"] = this.homePhone;
            }
            if(this.mobilePhone != undefined && this.mobilePhone != "" && this.mobilePhone != null){
                this.settings["mobile_phone"] = this.mobilePhone;
            }
            if(this.workPhone != undefined && this.workPhone != "" && this.workPhone != null){
                this.settings["work_phone"] = this.workPhone;
            }
            this.defaultGenericOptionsArray = this.defaultGenericOptions;
            this.pillArr = this.genericPillArr;
            this.firstRender = false;
            loadStyle(this, cssResource);
        }

        if(this.pillArr == null || this.pillArr === undefined || this.pillArr.length == 0){
            this.showEnterGenericMessage = true;
        }else{
            this.showEnterGenericMessage = false;
        }

        if(this.defaultGenericOptionsArray == null || this.defaultGenericOptionsArray === undefined || this.defaultGenericOptionsArray.length == 0){
            this.showSelectDefaultGeneric = false;
        }else{
            this.showSelectDefaultGeneric = true;
        }
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo({error, data}){
        if(data){
            var accounts = [];
            for(let key in data.fields){
                if(data.fields.hasOwnProperty(key)){
                    if(!STATIC_ACCOUNT_FIELDS.includes(key)){
                        accounts.push({value: key, label: key});
                    }
                }
            }
            this.accountFieldOptions = accounts;
        }else if(error) {
            this.showToast(
                "Error",
                error,
                "error"
            );
        }
    }

    handleComboboxChange = (event) => {
        let currentSetting = event.target.name;
        this.settings[currentSetting] = event.target.value;
    }

    addSSN = () => {
        const regexp = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;
        if (regexp.test(this.newSSN)){
            if((this.genericSSNs == undefined || this.genericSSNs == null) || !this.genericSSNs.includes(this.newSSN)){
                var i;
                var tempArr = [];
                var length = this.pillArr.length;

                for(i=0; i<length; i++){
                    tempArr.push({ label: this.pillArr[i].label, name: this.pillArr[i].name });
                }
                tempArr.push({ label: this.newSSN, name: this.newSSN });
                this.pillArr = tempArr;
                
                if(this.genericSSNs == undefined || this.genericSSNs == "" || this.genericSSNs == null){
                    this.genericSSNs = this.newSSN;
                }else{
                    this.genericSSNs += ', ' + this.newSSN;
                }
                this.settings["genericSSNs"] = this.genericSSNs;

                tempArr = [];
                for(i=0; i<length; i++){
                    tempArr.push({ label: this.defaultGenericOptionsArray[i].label, value: this.defaultGenericOptionsArray[i].value });
                }
                tempArr.push({ label: this.newSSN, value: this.newSSN });
                this.defaultGenericOptionsArray = tempArr;

                if(this.defaultGenericOptionsArray.length == 1){
                    this.defaultGenericSSN = this.defaultGenericOptionsArray[0].value;
                    this.settings["defaultGenericSSN"] = this.defaultGenericSSN;
                }
                this.newSSN = "";
                this.errorMessage = "";
                this.showErrorMessage = false;
            }else{
                this.errorMessage = "Generic Social Security Numbers must be unique";
                this.showErrorMessage = true;
            }
        }else{
            this.errorMessage = "Social Security Number must be 9 digits including dashes: ###-##-####";
            this.showErrorMessage = true;
        }
    }

    checkPillArrLength = (event) => {
        if(this.pillArr.length <= 1){
            this.showToast(
                "Error",
                "You must have at least one generic SSN.",
                "error"
            );
        }else{
            this.confirmDeletePill(event);
        }
    }

    confirmDeletePill = (event) => {
        var i;
        var length = this.pillArr.length;
        for(i=0; i<length; i++){
            if(event.target.name == this.pillArr[i].name){
                this.clickedPillIndex = i;
                this.clickedPillSSN = event.target.name;
                break;
            }
        }
        this.showDeletePill = true;
    }

    cancelDeletePill = () => {
        const refreshSettings = new CustomEvent('refreshsettings', {
            detail: {
                last_save_date: this.settings["last_save_date"],
                gender: this.settings["gender"],
                ssn: this.settings["ssn"],
                home_phone: this.settings["home_phone"],
                mobile_phone: this.settings["mobile_phone"],
                work_phone: this.settings["work_phone"],
                genericSSNs: this.settings["genericSSNs"],
                defaultGenericSSN: this.settings["defaultGenericSSN"]
            },
            bubbles: false,
            composed: false
        });
        this.dispatchEvent(refreshSettings);
        this.showDeletePill = false;
    }

    handlePillRemove = () => {
        var i;
        var length = this.pillArr.length;
        var index = this.clickedPillIndex;
        var tempDefaultGenericSSN;

        if(this.clickedPillSSN == this.defaultGenericSSN){
            if(index+1 == length){
                tempDefaultGenericSSN = this.defaultGenericOptionsArray[(index-1)].value;
            }else{
                tempDefaultGenericSSN = this.defaultGenericOptionsArray[(index+1)].value;
            }
        }else{
            tempDefaultGenericSSN = this.defaultGenericSSN;
        }

        var tempArr = [];
        for(i=0; i<length; i++){
            if(i != index){
                tempArr.push({ label: this.pillArr[i].name, name: this.pillArr[i].name });
            }
        }
        this.pillArr = tempArr;

        tempArr = [];
        for(i=0; i<length; i++){
            if(i != index){
                tempArr.push({ label: this.defaultGenericOptionsArray[i].label, value: this.defaultGenericOptionsArray[i].value });
            }
        }
        this.defaultGenericOptionsArray = tempArr;
        this.defaultGenericSSN = tempDefaultGenericSSN;
        this.settings["defaultGenericSSN"] = tempDefaultGenericSSN;

        var tempString;
        for(i=0; i<this.pillArr.length; i++){
            if(i == 0 && this.pillArr.length == 1){
                tempString = this.pillArr[i].name;
            }else if(i == 0){
                tempString = this.pillArr[i].name + ', ';
            }else if(i+1 == this.pillArr.length){
                tempString += this.pillArr[i].name;
            }else{
                tempString += this.pillArr[i].name + ', ';
            }
        }
        this.genericSSNs = tempString;
        this.settings["genericSSNs"] = this.genericSSNs;

        const refreshSettings = new CustomEvent('refreshsettings', {
            detail: {
                last_save_date: this.settings["last_save_date"],
                gender: this.settings["gender"],
                ssn: this.settings["ssn"],
                home_phone: this.settings["home_phone"],
                mobile_phone: this.settings["mobile_phone"],
                work_phone: this.settings["work_phone"],
                genericSSNs: this.settings["genericSSNs"],
                defaultGenericSSN: this.settings["defaultGenericSSN"]
            },
            bubbles: false,
            composed: false
        });
        this.dispatchEvent(refreshSettings);

        this.showDeletePill = false;
    }

    handleSSN_ComboboxChange = (event) => {
        this.settings["defaultGenericSSN"] = event.target.value;
    }

    handleInputChange = (event) => {
        let currentSetting = event.target.dataset.name;
        this.settings[currentSetting] = event.target.value;
    }

    handleSSNinput = (event) => {
        this.newSSN = event.target.value;
    }

    confirmSave = () => {
        this.showConfirmSave = true;
    }

    closeSettingsModal = () => {
        this.dispatchEvent(new CustomEvent('closesettings'));
    }

    showSettingsModal = () => {
        this.dispatchEvent(new CustomEvent('showsettings'));
    }

    saveSettings = event => {
        var self = this; 
        self.showConfirmSave = false;

        if(self.credentialsProvided != 'true' && Object.keys(self.settings).length != 10){
            self.showToast(
                "Error",
                "Every field is required in order to save settings.",
                "error"
            );
            return;
        }else if(self.credentialsProvided == 'true'){
            for(let key in self.settings){
                if(key != 'username' && key != 'password' && key != 'client_id'){
                    if(self.settings[key] == "" || self.settings[key] == undefined || self.settings[key] == null){
                        self.showToast(
                            "Error",
                            "Every field under Field Source Settings and Social Security Numbers is required in order to save settings.",
                            "error"
                        );
                        return;
                    }
                }
            }
        }

        saveSetApex({
          settings: self.settings
        })
          .then(result => {
            self.lastSaveDate = result.last_save_date;
            self.showLastCredentialSave = true;

            this.dispatchEvent(new CustomEvent('closesettings'));
            const initPreview = new CustomEvent('initpreview', {
                detail: {
                    gender: result.gender,
                    homePhone: result.home_phone,
                    mobilePhone: result.mobile_phone,
                    workPhone: result.work_phone,
                    ssn: result.ssn
                },
                bubbles: false,
                composed: false
            });
            this.dispatchEvent(initPreview);
            const refreshSettings = new CustomEvent('refreshsettings', { 
                detail: {
                    last_save_date: result.last_save_date,
                    gender: result.gender,
                    ssn: result.ssn,
                    home_phone: result.home_phone,
                    mobile_phone: result.mobile_phone,
                    work_phone: result.work_phone,
                    genericSSNs: result.genericSSNs,
                    defaultGenericSSN: result.defaultGenericSSN,
                    credentialsProvided: result.credentialsProvided
                },
                bubbles: false,
                composed: false
            });
            this.dispatchEvent(refreshSettings);

            self.showToast(
                "Success",
                "Settings have saved successfully",
                "success"
            );
          }).catch(
            function (error) {
                self.showToast(
                    "Error",
                    "Please contact your system administrator.",
                    "error"
                );
            });
    }

    showToast = (title, message, variant) => {
        const evt = new ShowToastEvent({
          title: title,
          message: message,
          variant: variant
        });
        this.dispatchEvent(evt);
    }
}