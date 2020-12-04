@isTest
private class BridgeEpicPatientCreateTest {

    @testSetup static void setup(){
        Id rtId = [SELECT Id FROM RecordType WHERE IsPersonType = TRUE AND SObjectType='Account' LIMIT 1].Id;
        Account a = new Account(
                                FirstName = 'John',
                                LastName = 'Smith',
                                PersonEmail = 'jsmith@fakeemail.com',
                                PersonBirthdate = Date.valueOf('2020-06-08'),
                                PersonMailingStreet = '123 Sesame Street',
                                PersonMailingCity = 'Chicago',
                                PersonMailingState = 'IL',
                                PersonMailingPostalCode = '60007',
                                PersonMailingCountry = 'United States',
                                Epic_ID__c = '3330003044',
                                Epic_MRN__c = '44450005055555555',
                                Last_Epic_Send_Date__c = Datetime.now(),
                                Last_Epic_Send_User__c = UserInfo.getUserId(),
                                Phone = '3338675309',
                                PersonMobilePhone = '4445556666',
                                PersonHomePhone = '5556667777',
                                PersonOtherCountry = 'Mexico',
                                PersonDepartment = 'Something',
            					RecordTypeId = rtId
                               );
        insert a;
    }
    
    @isTest static void getAccount_POS() {
                
        Account acct = [SELECT Id FROM Account LIMIT 1];
        List<String> fieldList = new List<String>();
        String field1 = 'Phone';
        String field2 = 'PersonMobilePhone';
        String field3 = 'PersonHomePhone';
        String field4 = 'PersonDepartment';
        String field5 = 'PersonOtherCountry';
        fieldList.add(field1);
        fieldList.add(field2);
        fieldList.add(field3);
        fieldList.add(field4);
        fieldList.add(field5);
        
        Test.startTest();
            Map<String,String> valueMap = BridgeEpicPatientCreate.getAccount(acct.Id, fieldList);
        Test.stopTest();
        
        System.assertNotEquals(valueMap.get('FirstName'), null);
        System.assertNotEquals(valueMap.get('LastName'), null);
        System.assertNotEquals(valueMap.get('PersonEmail'), null);
        System.assertNotEquals(valueMap.get('PersonBirthdate'), null);
        System.assertNotEquals(valueMap.get('PersonMailingStreet'), null);
        System.assertNotEquals(valueMap.get('PersonMailingCity'), null);
        System.assertNotEquals(valueMap.get('PersonMailingState'), null);
        System.assertNotEquals(valueMap.get('PersonMailingPostalCode'), null);
        System.assertNotEquals(valueMap.get('PersonMailingCountry'), null);
        System.assertNotEquals(valueMap.get('Epic_ID__c'), null);
        System.assertNotEquals(valueMap.get('Epic_MRN__c'), null);
        System.assertNotEquals(valueMap.get('Last_Epic_Send_Date__c'), null);
        System.assertNotEquals(valueMap.get('Last_Epic_Send_User'), null);
        System.assertNotEquals(valueMap.get('gender'), null);
        System.assertNotEquals(valueMap.get('homePhone'), null);
        System.assertNotEquals(valueMap.get('mobilePhone'), null);
        System.assertNotEquals(valueMap.get('workPhone'), null);
        System.assertNotEquals(valueMap.get('ssn'), null);
    }
    
    @isTest static void getAccount_NEG(){
        Account acct = [SELECT Id FROM Account LIMIT 1];
        List<String> fieldList = new List<String>();
        String field1 = 'Phone';
        String field2 = 'PersonMobilePhone';
        String field3 = 'PersonHomePhone';
        String field4 = 'PersonDepartment';
        String field5 = 'PersonOtherCountry';
        fieldList.add(field1);
        fieldList.add(field2);
        fieldList.add(field3);
        fieldList.add(field4);
        fieldList.add(field5);
        
        Test.startTest();
            Map<String,String> valueMap = BridgeEpicPatientCreate.getAccount('', fieldList);
        Test.stopTest();
        
        System.assertEquals(0, valueMap.size());
    }
    
    @isTest static void saveSettings_NEG(){
        Map<String, String> settingsMap = new Map<String, String>();
        settingsMap.put('defaultGenericSSN', '000-00-0000');
        settingsMap.put('username', 'testusername');
        settingsMap.put('password', '67gr7rtr6');
        settingsMap.put('client_id', '999699978657544');
        settingsMap.put('gender', 'Gender__c');
        settingsMap.put('ssn', 'SSN__c');
        settingsMap.put('genericSSNs', '000-00-0000, 111-11-1111, 222-22-2222');
        settingsMap.put('home_phone', '3334445555');
        settingsMap.put('mobile_phone', '4445556666');
        settingsMap.put('work_phone', '5556667777');
                
        Test.startTest();
            Map<String, String> returnMap = BridgeEpicPatientCreate.saveSettings(settingsMap);
        Test.stopTest();
                
        System.assertNotEquals(settingsMap.size(), returnMap.size());
        System.assertNotEquals(null, returnMap.get('defaultGenericSSN'));
        System.assertNotEquals(null, returnMap.get('gender'));
        System.assertNotEquals(null, returnMap.get('ssn'));
        System.assertNotEquals(null, returnMap.get('genericSSNs'));
        System.assertNotEquals(null, returnMap.get('home_phone'));
        System.assertNotEquals(null, returnMap.get('mobile_phone'));
        System.assertNotEquals(null, returnMap.get('work_phone'));
        
    }

    @isTest static void sendPatientTest(){

        Map<String, String> settingsMap = new Map<String, String>();
        settingsMap.put('defaultGenericSSN', '000-00-0000');
        settingsMap.put('username', 'testusername');
        settingsMap.put('password', '67gr7rtr6');
        settingsMap.put('client_id', '999699978657544');
        settingsMap.put('gender', 'Gender__c');
        settingsMap.put('ssn', 'SSN__c');
        settingsMap.put('genericSSNs', '000-00-0000, 111-11-1111, 222-22-2222');
        settingsMap.put('home_phone', '3334445555');
        settingsMap.put('mobile_phone', '4445556666');
        settingsMap.put('work_phone', '5556667777');
                

        Map<String, String> payload = new Map<String, String>();
        payload.put('FirstName', 'Brittany');
        payload.put('IsGenericSSN', 'false');
        payload.put('LastName', 'Howard');
        payload.put('PersonBirthDate', '1998-06-08');
        payload.put('PersonEmail', 'bhoward@alabamashakes.com');
        payload.put('PersonGender', 'Female');
        payload.put('SSN', '343-89-5647');
                
        Test.startTest();
            Map<String, String> returnMap = BridgeEpicPatientCreate.saveSettings(settingsMap);
            String response = BridgeEpicPatientCreate.sendPatient(payload);
        Test.stopTest();
        
    }
    
    
    @isTest static void getSettings_POS(){
        List<EpicSettings__c> es_Settings = new List<EpicSettings__c>{new EpicSettings__c(Name='username', Value__c='EpicUsername'),
                                                                      new EpicSettings__c(Name='password', Value__c='ffjjbncu345'),
                                                                      new EpicSettings__c(Name='client_id', Value__c='393489676758489'),
                                                                      new EpicSettings__c(Name='gender', Value__c='PersonDepartment'),
                                                                      new EpicSettings__c(Name='ssn', Value__c='PersonOtherCountry'),
                                                                      new EpicSettings__c(Name='home_phone', Value__c='2223334444'),
                                                                      new EpicSettings__c(Name='mobile_phone', Value__c='3334445555'),
                                                                      new EpicSettings__c(Name='work_phone', Value__c='5556667777'),
                                                                      new EpicSettings__c(Name='last_save_date', Value__c='6/17/2020'),
                                                                      new EpicSettings__c(Name='defaultGenericSSN', Value__c='000-00-0000'),
                                                                      new EpicSettings__c(Name='genericSSNs', Value__c='EpicUsername')
                                                                     };
        insert es_Settings;
        
        Map<String,String> returnMap;
        
        Test.startTest();
            returnMap = BridgeEpicPatientCreate.getSettings();
        Test.stopTest();
        
        System.assertNotEquals(returnMap, null);
        System.assertNotEquals(null, returnMap.get('defaultGenericSSN'));
        System.assertNotEquals(null, returnMap.get('gender'));
        System.assertNotEquals(null, returnMap.get('ssn'));
        System.assertNotEquals(null, returnMap.get('genericSSNs'));
        System.assertNotEquals(null, returnMap.get('home_phone'));
        System.assertNotEquals(null, returnMap.get('mobile_phone'));
        System.assertNotEquals(null, returnMap.get('work_phone'));
        System.assertNotEquals(null, returnMap.get('last_save_date'));
    }
    
    @isTest static void getSettings_NEG(){
        
        Map<String,String> returnMap;
        
        Test.startTest();
            returnMap = BridgeEpicPatientCreate.getSettings();
        Test.stopTest();
        
        System.assertEquals(0, returnMap.size());
    }
    
    @isTest static void isAdmin_POS(){
        Map<String,String> returnMap;
        
        Test.startTest();
            returnMap = BridgeEpicPatientCreate.isAdmin();
        Test.stopTest();
        
        System.assertNotEquals(null, returnMap.get('name'));
        System.assertEquals('true', returnMap.get('isAdmin'));
    }
    
    @isTest static void isAdmin_NEG(){
        Profile p = [SELECT Id, Name FROM Profile WHERE Name = 'Standard User'];
        User u = new User(FirstName='Jane', 
                          LastName='Smith', 
                          ProfileId = p.Id,
                          Username = 'something@fakeemail.com',
                          Email = 'something2@fakeemail2.com',
                          Alias = 'jsmith',
                          TimeZoneSidKey = 'America/New_York',
                          LocaleSidKey = 'en_CA',
                          EmailEncodingKey = 'ISO-8859-1',
                          LanguageLocaleKey = 'en_US');
        
        Map<String,String> returnMap;
        
        System.runAs(u){
            Test.startTest();
                returnMap = BridgeEpicPatientCreate.isAdmin();
            Test.stopTest();
        }
        
        System.assertNotEquals(null, returnMap.get('name'));
        System.assertEquals('false', returnMap.get('isAdmin'));
    }
    
}