const Response = require("./Response");

class CombiningAlgorithm {
    constructor(type) {
        if (!(['denyOverrides', 'permitOverrides', 'firstApplicable', 'permitUnlessDeny', 'denyUnlessPermit']).includes(type)) {
            throw new Error("Invalid combining algorithm type!");
        }
        this.type = type; 
    }

    combine(responses) {
        switch(this.type) {
            case "denyOverrides":
                return this._denyOverrides(responses);
            case "permitOverrides":
                return this._permitOverrides(responses);
            case "firstApplicable":
                return this._firstApplicable(responses);
            case "permitUnlessDeny":
                return this._permitUnlessDeny(responses);
            case "denyUnlessPermit":
                return this._denyUnlessPermit(responses);
            default:
                throw new Error("Could not evaluate invalid algorithm type!");
        }
    }

    // Deny overrides, so [Permit, Permit, Permit, Deny] is Deny.. but can still be NotApplicable eg if [NA, NA]
    _denyOverrides(responses) {
        // TODO: Collect obligations from all responses?
        let response = new Response();
        if ((responses.filter(r=> r.Decision == "Deny")).length > 0) {
            response.setDecision("Deny");
        } else if ((responses.filter(r=> r.Decision == "Permit")).length > 0) {
            response.setDecision("Permit");
        }
        return response;
    }

    _permitOverrides(responses) {
        // TODO: Collect obligations from all responses?
        let response = new Response();
        if ((responses.filter(r=> r.Decision == "Permit")).length > 0) {
            response.setDecision("Permit");
        } else if ((responses.filter(r=> r.Decision == "Deny")).length > 0) {
            response.setDecision("Deny");
        }
        return response;
    }

    _firstApplicable(responses) {
        for(let i=0; i<responses.length; i++) {
            let r = responses[i];
            if (r.Decision == "Permit" || r.Decision == "Deny") {
                return r;
            }
        }
        // Only returns new response if no valid permit/deny response in the provided responses
        return new Response();
    }

    _permitUnlessDeny(responses) {
        let response = new Response();
        if ((responses.filter(r=>r.Decision=="Deny")).length > 0) {
            // Responses DOES contain a Deny
            response.setDecision("Deny");
        } else {
            // There are no Deny's so will permit
            response.setDecision("Permit");
        }
        return response;
    }

    _denyUnlessPermit(responses) {
        let response = new Response();
        if ((responses.filter(r=>r.Decision=="Permit")).length > 0) {
            // Responses DOES contain a Permit
            response.setDecision("Permit");
        } else {
            response.setDecision("Deny");
        }
        return response;
    }
}

module.exports = CombiningAlgorithm;