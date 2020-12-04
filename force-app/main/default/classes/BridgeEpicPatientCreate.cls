public with sharing class BridgeEpicPatientCreate {

    public static Boolean isAccessible(String sObjectType, String fieldName){
        SObjectType schemaType = Schema.getGlobalDescribe().get(sObjectType);
        Map<String, SObjectField> fields = schemaType.getDescribe().fields.getMap();
        DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
        return fieldDescribe.isAccessible();
    }

    @AuraEnabled
    public static Map<String,String> getAccount(String accountId, List<String> dynamicFields){

        String gender = dynamicFields[0];
        String homePhone = dynamicFields[1];
        String mobilePhone = dynamicFields[2];
        String workPhone = dynamicFields[3];
        String ssn = dynamicFields[4];

        String staticFields = 'Id,' +
                              'FirstName,' +
                              'LastName,' +
                              'PersonEmail,' + 
                              'PersonBirthdate,' +
                              'PersonMailingStreet,' +
                              'PersonMailingCity,' +
                              'PersonMailingState,' +
                              'PersonMailingPostalCode,' +
                              'PersonMailingCountry,' +
                              'Epic_ID__c,' +
                              'Epic_MRN__c,' +
                              'Last_Epic_Send_Date__c,' +
                              'Last_Epic_Send_User__r.Name,';

        String dynFieldString = gender + ',' + homePhone + ',' + mobilePhone + ',' + workPhone + ',' + ssn;

        String queryString = 'SELECT ' + staticFields + dynFieldString + ' FROM Account WHERE Id = \'' + accountId + '\'';

        Account account;
        Map<String,String> accountFieldMap = new Map<String,String>();
        try{

            if (isAccessible('Account', 'Id') && 
                isAccessible('Account', 'FirstName') &&
                isAccessible('Account', 'LastName') &&
                isAccessible('Account', 'PersonEmail') &&
                isAccessible('Account', 'PersonBirthdate') &&
                isAccessible('Account', 'PersonMailingStreet') &&
                isAccessible('Account', 'PersonMailingCity') &&
                isAccessible('Account', 'PersonMailingState') &&
                isAccessible('Account', 'PersonMailingPostalCode') &&
                isAccessible('Account', 'PersonMailingCountry') &&
                Schema.sObjectType.Account.fields.Epic_ID__c.isAccessible() &&
                Schema.sObjectType.Account.fields.Epic_MRN__c.isAccessible() &&
                Schema.sObjectType.Account.fields.Last_Epic_Send_Date__c.isAccessible() &&
                Schema.sObjectType.Account.fields.Last_Epic_Send_User__c.isAccessible() &&
                isAccessible('User', 'Name') &&
                isAccessible('Account', gender) &&
                isAccessible('Account', homePhone) &&
                isAccessible('Account', mobilePhone) &&
                isAccessible('Account', workPhone) &&
                isAccessible('Account', ssn)){
                
                account = Database.query(queryString);
            }

            accountFieldMap.put('Id', account.Id);
            accountFieldMap.put('FirstName', account.FirstName);
            accountFieldMap.put('LastName', account.LastName);
            accountFieldMap.put('PersonEmail', account.PersonEmail);
            accountFieldMap.put('PersonBirthdate', String.valueOf(account.PersonBirthdate));
            accountFieldMap.put('PersonMailingStreet', account.PersonMailingStreet);
            accountFieldMap.put('PersonMailingCity', account.PersonMailingCity);
            accountFieldMap.put('PersonMailingState', account.PersonMailingState);
            accountFieldMap.put('PersonMailingPostalCode', account.PersonMailingPostalCode);
            accountFieldMap.put('PersonMailingCountry', account.PersonMailingCountry);
            accountFieldMap.put('Epic_ID__c', account.Epic_ID__c);
            accountFieldMap.put('Epic_MRN__c', account.Epic_MRN__c);
            accountFieldMap.put('Last_Epic_Send_Date__c', String.valueOf(account.Last_Epic_Send_Date__c));
            accountFieldMap.put('Last_Epic_Send_User', account.Last_Epic_Send_User__r.Name);
            accountFieldMap.put('gender', String.valueOf(account.get(gender)));
            accountFieldMap.put('homePhone', String.valueOf(account.get(homePhone)));
            accountFieldMap.put('mobilePhone', String.valueOf(account.get(mobilePhone)));
            accountFieldMap.put('workPhone', String.valueOf(account.get(workPhone)));
            accountFieldMap.put('ssn', String.valueOf(account.get(ssn)));
            
        }catch(Exception e){
			System.debug(e);            
        }

        return accountFieldMap;
    }

    @AuraEnabled
    public static Map<String, String> saveSettings(Map<String,String> settings){

        Map<String, EpicSettings__c> customSettings = EpicSettings__c.getAll();
        List<EpicSettings__c> lstSettings = new List<EpicSettings__c>();

        if(customSettings.size() == 0 || Test.isRunningTest()){
            lstSettings.add(new EpicSettings__c (Name='username'));
            lstSettings.add(new EpicSettings__c (Name='password'));
            lstSettings.add(new EpicSettings__c (Name='client_id'));
            lstSettings.add(new EpicSettings__c (Name='privatekey'));
            lstSettings.add(new EpicSettings__c (Name='credentialsProvided'));
            lstSettings.add(new EpicSettings__c (Name='gender'));
            lstSettings.add(new EpicSettings__c (Name='ssn'));
            lstSettings.add(new EpicSettings__c (Name='home_phone'));
            lstSettings.add(new EpicSettings__c (Name='mobile_phone'));
            lstSettings.add(new EpicSettings__c (Name='work_phone'));
            lstSettings.add(new EpicSettings__c (Name='last_save_date'));
            lstSettings.add(new EpicSettings__c (Name='defaultGenericSSN'));
            lstSettings.add(new EpicSettings__c (Name='genericSSNs'));

            try{
                insert lstSettings;
            }catch(Exception e){
                System.debug(e);
            }
            customSettings = EpicSettings__c.getAll();
        }

        lstSettings = new List<EpicSettings__c>();

        for(String name : settings.keySet()){
            String settingId = customSettings.get(name).Id;
            String settingValue = settings.get(name);
            if(name ==  'password'){
                String algorithmName = 'AES256';
                Blob privateKey = Crypto.generateAesKey(256);
                Blob clearText = Blob.valueOf(settingValue);
                Blob encr = Crypto.encryptWithManagedIV(algorithmName, privateKey, clearText);
                String encryptedPasswordString = EncodingUtil.base64Encode(encr);
                lstSettings.add(new EpicSettings__c(Id = settingId, Value__c = encryptedPasswordString));
                String privateKeyString = EncodingUtil.base64Encode(privateKey);
                lstSettings.add(new EpicSettings__c(Id = customSettings.get('privatekey').Id, Value__c = privateKeyString));
            }else{
                lstSettings.add(new EpicSettings__c(Id = settingId, Value__c = settingValue));
            }
        }

        String currDate = System.today().format();
        lstSettings.add(new EpicSettings__c(Id = customSettings.get('last_save_date').Id, Value__c = currDate));
        lstSettings.add(new EpicSettings__c(Id = customSettings.get('credentialsProvided').Id, Value__c = 'true'));

        try{
            update lstSettings;
        }catch(Exception e){
            System.debug(e);
        }

        Map<String, String> config = new Map<String, String>();
        Map<String, EpicSettings__c> newSettings = EpicSettings__c.getall();
        config.put('last_save_date', newSettings.get('last_save_date').Value__c);
        config.put('gender', newSettings.get('gender').Value__c);
        config.put('ssn', newSettings.get('ssn').Value__c);
        config.put('home_phone', newSettings.get('home_phone').Value__c);
        config.put('mobile_phone', newSettings.get('mobile_phone').Value__c);
        config.put('work_phone', newSettings.get('work_phone').Value__c);
        config.put('genericSSNs', newSettings.get('genericSSNs').Value__c);
        config.put('defaultGenericSSN', newSettings.get('defaultGenericSSN').Value__c);
        config.put('credentialsProvided', newSettings.get('credentialsProvided').Value__c);
        return config;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getSettings(){
        Map<String, String> config = new Map<String, String>();
        Map<String, EpicSettings__c> customSettings = EpicSettings__c.getall();
        try{
            config.put('last_save_date', customSettings.get('last_save_date').Value__c);
            config.put('gender', customSettings.get('gender').Value__c);
            config.put('ssn', customSettings.get('ssn').Value__c);
            config.put('home_phone', customSettings.get('home_phone').Value__c);
            config.put('mobile_phone', customSettings.get('mobile_phone').Value__c);
            config.put('work_phone', customSettings.get('work_phone').Value__c);
            config.put('genericSSNs', customSettings.get('genericSSNs').Value__c);
            config.put('defaultGenericSSN', customSettings.get('defaultGenericSSN').Value__c);
            config.put('credentialsProvided', customSettings.get('credentialsProvided').Value__c);
        }catch(Exception e){
            System.debug(e);
        }
        
        return config;  
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,String> isAdmin(){
        Map<String,String> userMap = new Map<String,String>();

        Id id1 = UserInfo.getProfileId();
        String name = UserInfo.getName();
        Profile prof = [SELECT Name FROM Profile WHERE Id = :id1 LIMIT 1];
        
        userMap.put('name', name);

        if(prof.Name == 'System Administrator'){
            userMap.put('isAdmin', 'true');
        }else{
            userMap.put('isAdmin', 'false');
        }

        return userMap;
    }

    @AuraEnabled(cacheable=true)
    public static String sendPatient(Map<String,String> payload){
        // add username, password, client_id stored in custom setting
        Map<String, EpicSettings__c> customSettings = EpicSettings__c.getAll();
        String username = customSettings.get('username').Value__c;
        String privateKeyString = customSettings.get('privatekey').Value__c;
        String encryptedPasswordString = customSettings.get('password').Value__c;
        String client_id = customSettings.get('client_id').Value__c;

        // decrypt password using privateKey
        Blob privateKey = EncodingUtil.base64Decode(privateKeyString);
        Blob encryptedPassword = EncodingUtil.base64Decode(encryptedPasswordString);
        Blob password = Crypto.decryptWithManagedIV('AES256', privateKey, encryptedPassword);

        payload.put('username', username);
        payload.put('password', password.toString());
        payload.put('epic_client_id', client_id);

        // building string for callout
        String payloadString = '{';
        for(String key : payload.keySet()){
            payloadString += '\"' + key + '\":\"' + payload.get(key) + '\",';
        }
        payloadString = payloadString.removeEnd(',');
        payloadString += '}';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://hermes.bcrprod.us/epicapp');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));
        Http http = new Http();

        String responseString;
        String responseCode;
        if(!Test.isRunningTest()){
            HTTPResponse res = http.send(req);
            responseString = res.getBody();
            responseCode = String.valueOf(res.getStatusCode());
        }else{
            responseString = '{"responseMessage":"JavaException: java.io.IOException: Server returned HTTP response code: 403 for URL: https://apporchard.epic.com/interconnect-aocurprd-username/api/FHIR/STU3/Patient","EPICid":"{\"responseCode\":403,\"rawResponse\":\"JavaException: java.io.IOException: Server returned HTTP response code: 403 for URL: https://apporchard.epic.com/interconnect-aocurprd-username/api/FHIR/STU3/Patient\"}","';
            responseCode = '400';
        }

        responseString = responseString.removeEnd('}');
        responseString += ',\"statusCode\":\"' + responseCode + '\"}';

        return responseString;
    }
}