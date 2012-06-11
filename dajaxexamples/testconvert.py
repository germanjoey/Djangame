
import inspect
import django.db.models
import examples.models as game_models

def extract_custom_methods(cmodels):
    codesets = []
    for name, obj in inspect.getmembers(cmodels):
      if inspect.isclass(obj) and (django.db.models.Model in obj.__bases__):
      # will want to change django.models.Model to GameData or w/e to flag only relevant classes
        objfile = inspect.getfile(obj)
        for attr in dir(obj):
            gotattr = getattr(obj,attr)
            try:
                attrfile = inspect.getfile(gotattr)
                if (type(gotattr) != types.TypeType) and ((attrfile in objfile) or (objfile in attrfile)):
                    codesets.append([name, [re.sub(r'\n',r'',line) for line in inspect.getsourcelines(gotattr)[0]]])
            except:
                pass
    return codesets
        
        if gotattr: # is a function
                # print the code of the function as-is      
                
              elif gotattr: # is a type of django object
                # print a converted equivalent

              elif gotattr: # is anything else - use at your own risk
                # print as-is+