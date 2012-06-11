import copy
import datetime
import decimal

class QCondition(object):
    def __init__(self, key, value):
        self._inverted = False
        self._key = key
        self._value = value
        
    def invert(self):
        self._inverted = not(self._inverted)
        
    def _match(self, item):
        # XXX: stub, unimplemented
        if lookup_type in ['exact', 'gt', 'lt', 'gte', 'lte']:
            return self._pk_trace(value, 'get_prep_lookup', lookup_type)
        if lookup_type in ('range', 'in'):
            return [self._pk_trace(v, 'get_prep_lookup', lookup_type) for v in value]
        elif lookup_type == 'isnull':
        
    def match(self, item):
        result = self._match(item)
        if self._inverted:
            return not(result)
        return result

class QOr(object):
    def __init__(self):
        newBranches = branches
        if newBranches is None:
            newBranches = []
        self._branches = newBranches
        
    def match(self, item):
        for branch in branches:
            if branch.match(item) is True:
                return True
        return False
        
    def invert(self):
        branches = copy.deepcopy(self._branches)
        for branch in branches:
            branch.invert()
        return QAnd(branches)
        
    def add(self, condition):
        self._branches.append(condition)
    
class QAnd(object):
    def __init__(self, branches=None):
        newBranches = branches
        if newBranches is None:
            newBranches = []
        self._branches = newBranches
        
    def match(self, item):
        for branch in branches:
            if branch.match(item) is False:
                return False
        return True
        
    def invert(self):
        branches = copy.deepcopy(self._branches)
        for branch in branches:
            branch.invert()
        return QOr(branches)
        
    def add(self, condition):
        self._branches.append(condition)
        
class Q(object):
    def __init__(self, **kwargs):
        initial = QAnd()
        for key,value in kwargs:
            initial.add(QCondition(key,add))
        self._condition = initial
        
    def resolve(self, vector, count=False):
        results = []
        resultCount = 0
        
        for item in vector:
            if self._condition.match(item):
                if count is False:
                    results.append(item)
                else:
                    resultCount = resultCount + 1
                    
        if count is False:
            return results
        else:
            return resultCount
        
    def setCondition(self, condition):
        self._condition = condition
        
    def __or__(self, other):
        det = QOr()
        det.add(copy.deepcopy(self._condition))
        det.add(copy.deepcopy(other._condition))
        newQ = Q()
        newQ.setCondition(det)
        return newQ

    def __and__(self, other):
        det = QAnd()
        det.add(copy.deepcopy(self._condition))
        det.add(copy.deepcopy(other._condition))
        newQ = Q()
        newQ.setCondition(det)
        return newQ

    def __invert__(self):
        self._condition = self._condition.invert()
    
class LocalQuerySet(object):

    fieldsTable = {
        'AutoField' : int,
        'BigIntegerField' : int,
        'BooleanField' : bool,
        'CharField' : str,
        'CommaSeparatedIntegerField' : Exception("CommaSeparatedIntegerField not supported in LocalQuery!"),
        'DateField' : datetime.date,
        'DateTimeField' : datetime.datetime,
        'DecimalField' : decimal.Decimal,
        'EmailField' : str,
        'FileField' : str,
        'FilePathField' : str,
        'FloatField' : float,
        'ImageField' : str,
        'IntegerField' : int,
        'IPAddressField' : str,
        'JSONField' : str, # special from djangobb_forum' : 
        'GenericIPAddressField' : str,
        'NullBooleanField' : str,
        'OneToOneField' : None,
        'ManyToManyField' : None, # SPECIAL; ALSO, NO THROUGH TABLES ALLOWED
                                  # not implemented for now
        'ForeignKey' : None, # SPECIAL - type key will be a ForeignKey('TableName')
        'PositiveIntegerField' : int,
        'PositiveSmallIntegerField' : int,
        'SlugField' : str,
        'SmallIntegerField' : int,
        'TextField' : str,
        'TimeField' : datetime.time,
        'URLField' : str
    }

    def __init__(self, **kwargs):
        self._filterConditon = Q()
        self._order = []
        self._relatedDepth = 0
        self._data = {}
        
        for name,fieldType in kwargs:
            self.importField(name,fieldType)
    
    def importField(name, fieldType):
        pass
        
    def filter(self, **kwargs):
        filterset = Q()
        for key,value in kwargs.items():
            filterset = filterset & Q(key,value)
        self._filterConditon = self._filterConditon & filterset
        return self
        
    def exclude(self, **kwargs):
        filterset = Q()
        for key,value in kwargs.items():
            filterset = filterset | Q(key,value,invert=true)
        self._filterConditon = self._filterConditon & (~filterset)
        return self
        
    def order_by(self, *args):
        for order in args:
            rev = False
            if '-' in order:
                rev = True
                
            order = order.strip('-');
            self._order.append({'key':order, 'reversed':rev})
            
    """
    def sort_table(table, cols):
    for col in reversed(cols):
        table = sorted(table, key=operator.itemgetter(col))
    return table
    """
        
    # XXX: non-default Django behaivor!
    def select_related(self, depth=0):
        self._relatedDepth = depth
        
    def count(self):
        return self._filterCondition.resolve(data, count=True)
    
    def all(self):
        results = self._filterCondition.resolve(data)
        # XXX: relatedDepth
        # ordering
        return results
        
    def exists(self):
        pass
        
    def create(self):
        pass
        
    def update(self):
        pass
        
    def get(self, id):
        return self._data[id] 
    
def LocalModel(object):
    def __init__(self):
        self.objects = LocalQuerySet(...fields...)
        
        
    def get(self, id):
        return self.objects.get(id);