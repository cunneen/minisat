###################################################################################################

.PHONY:	r d p sh cr cd cp csh lr ld lp lsh config all install install-headers install-lib\
        install-bin clean distclean
all:	r lr lsh

## Load common Configuration ####################################################################

include Makefile.common

ECHO=@echo
ifeq ($(VERB),)
VERB=@
else
VERB=
endif

SRCS = $(wildcard minisat/core/*.cc) $(wildcard minisat/simp/*.cc) $(wildcard minisat/utils/*.cc)
HDRS = $(wildcard minisat/mtl/*.h) $(wildcard minisat/core/*.h) $(wildcard minisat/simp/*.h) $(wildcard minisat/utils/*.h)
OBJS = $(filter-out %Main.o, $(SRCS:.cc=.o))

r:	$(BUILD_DIR)/release/bin/$(MINISAT)
d:	$(BUILD_DIR)/debug/bin/$(MINISAT)
p:	$(BUILD_DIR)/profile/bin/$(MINISAT)
sh:	$(BUILD_DIR)/dynamic/bin/$(MINISAT)

cr:	$(BUILD_DIR)/release/bin/$(MINISAT_CORE)
cd:	$(BUILD_DIR)/debug/bin/$(MINISAT_CORE)
cp:	$(BUILD_DIR)/profile/bin/$(MINISAT_CORE)
csh:	$(BUILD_DIR)/dynamic/bin/$(MINISAT_CORE)

lr:	$(BUILD_DIR)/release/lib/$(MINISAT_SLIB)
ld:	$(BUILD_DIR)/debug/lib/$(MINISAT_SLIB)
lp:	$(BUILD_DIR)/profile/lib/$(MINISAT_SLIB)
lsh:	$(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE)

## Build-type Compile-flags:
$(BUILD_DIR)/release/%.o:			MINISAT_CXXFLAGS +=$(MINISAT_REL) $(MINISAT_RELSYM)
$(BUILD_DIR)/debug/%.o:				MINISAT_CXXFLAGS +=$(MINISAT_DEB) -g
$(BUILD_DIR)/profile/%.o:			MINISAT_CXXFLAGS +=$(MINISAT_PRF) -pg
$(BUILD_DIR)/dynamic/%.o:			MINISAT_CXXFLAGS +=$(MINISAT_REL) $(MINISAT_FPIC)

## Build-type Link-flags:
$(BUILD_DIR)/profile/bin/$(MINISAT):		MINISAT_LDFLAGS += -pg
$(BUILD_DIR)/release/bin/$(MINISAT):		MINISAT_LDFLAGS += $(RELEASE_LDFLAGS) $(MINISAT_RELSYM)
$(BUILD_DIR)/profile/bin/$(MINISAT_CORE):	MINISAT_LDFLAGS += -pg
$(BUILD_DIR)/release/bin/$(MINISAT_CORE):	MINISAT_LDFLAGS += $(RELEASE_LDFLAGS) $(MINISAT_RELSYM)

## Executable dependencies
$(BUILD_DIR)/release/bin/$(MINISAT):	 	$(BUILD_DIR)/release/minisat/simp/Main.o $(BUILD_DIR)/release/lib/$(MINISAT_SLIB)
$(BUILD_DIR)/debug/bin/$(MINISAT):	 	$(BUILD_DIR)/debug/minisat/simp/Main.o $(BUILD_DIR)/debug/lib/$(MINISAT_SLIB)
$(BUILD_DIR)/profile/bin/$(MINISAT):	 	$(BUILD_DIR)/profile/minisat/simp/Main.o $(BUILD_DIR)/profile/lib/$(MINISAT_SLIB)
# need the main-file be compiled with fpic?
$(BUILD_DIR)/dynamic/bin/$(MINISAT):	 	$(BUILD_DIR)/dynamic/minisat/simp/Main.o $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB)

## Executable dependencies (core-version)
$(BUILD_DIR)/release/bin/$(MINISAT_CORE):	$(BUILD_DIR)/release/minisat/core/Main.o $(BUILD_DIR)/release/lib/$(MINISAT_SLIB)
$(BUILD_DIR)/debug/bin/$(MINISAT_CORE):	 	$(BUILD_DIR)/debug/minisat/core/Main.o $(BUILD_DIR)/debug/lib/$(MINISAT_SLIB)
$(BUILD_DIR)/profile/bin/$(MINISAT_CORE):	$(BUILD_DIR)/profile/minisat/core/Main.o $(BUILD_DIR)/profile/lib/$(MINISAT_SLIB)
# need the main-file be compiled with fpic?
$(BUILD_DIR)/dynamic/bin/$(MINISAT_CORE): 	$(BUILD_DIR)/dynamic/minisat/core/Main.o $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB)

## Library dependencies
$(BUILD_DIR)/release/lib/$(MINISAT_SLIB):	$(foreach o,$(OBJS),$(BUILD_DIR)/release/$(o))
$(BUILD_DIR)/debug/lib/$(MINISAT_SLIB):		$(foreach o,$(OBJS),$(BUILD_DIR)/debug/$(o))
$(BUILD_DIR)/profile/lib/$(MINISAT_SLIB):	$(foreach o,$(OBJS),$(BUILD_DIR)/profile/$(o))
$(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE)\
 $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR)\
 $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB):	$(foreach o,$(OBJS),$(BUILD_DIR)/dynamic/$(o))

## Compile rules (these should be unified, buit I have not yet found a way which works in GNU Make)
$(BUILD_DIR)/release/%.o:	%.cc
	$(ECHO) Compiling: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $(MINISAT_CXXFLAGS) $(CXXFLAGS) -c -o $@ $< -MMD -MF $(BUILD_DIR)/release/$*.d

$(BUILD_DIR)/profile/%.o:	%.cc
	$(ECHO) Compiling: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $(MINISAT_CXXFLAGS) $(CXXFLAGS) -c -o $@ $< -MMD -MF $(BUILD_DIR)/profile/$*.d

$(BUILD_DIR)/debug/%.o:	%.cc
	$(ECHO) Compiling: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $(MINISAT_CXXFLAGS) $(CXXFLAGS) -c -o $@ $< -MMD -MF $(BUILD_DIR)/debug/$*.d

$(BUILD_DIR)/dynamic/%.o:	%.cc
	$(ECHO) Compiling: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $(MINISAT_CXXFLAGS) $(CXXFLAGS) -c -o $@ $< -MMD -MF $(BUILD_DIR)/dynamic/$*.d

## Linking rule
$(BUILD_DIR)/release/bin/$(MINISAT) $(BUILD_DIR)/debug/bin/$(MINISAT) $(BUILD_DIR)/profile/bin/$(MINISAT) $(BUILD_DIR)/dynamic/bin/$(MINISAT)\
$(BUILD_DIR)/release/bin/$(MINISAT_CORE) $(BUILD_DIR)/debug/bin/$(MINISAT_CORE) $(BUILD_DIR)/profile/bin/$(MINISAT_CORE) $(BUILD_DIR)/dynamic/bin/$(MINISAT_CORE):
	$(ECHO) Linking Binary: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $^ $(MINISAT_LDFLAGS) $(LDFLAGS) -o $@

## Static Library rule
%/lib/$(MINISAT_SLIB):
	$(ECHO) Linking Static Library: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(AR) -rcs $@ $^

## Shared Library rule
$(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE)\
 $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR)\
 $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB):
	$(ECHO) Linking Shared Library: $@
	$(VERB) mkdir -p $(dir $@)
	$(VERB) $(CXX) $^ $(SHARED_LDFLAGS) $(MINISAT_LDFLAGS) $(LDFLAGS) -o $@
	$(VERB) ln -sf $(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE) $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR)
	$(VERB) ln -sf $(MINISAT_DLIB).$(SOMAJOR) $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB)

install:	install-headers install-lib install-bin
install-debug:	install-headers install-lib-debug

install-headers:
#       Create directories
	$(INSTALL) -d $(DESTDIR)$(includedir)/minisat
	for dir in mtl utils core simp; do \
	  $(INSTALL) -d $(DESTDIR)$(includedir)/minisat/$$dir ; \
	done
#       Install headers
	for h in $(HDRS) ; do \
	  $(INSTALL) -m 644 $$h $(DESTDIR)$(includedir)/$$h ; \
	done

install-lib-debug: $(BUILD_DIR)/debug/lib/$(MINISAT_SLIB)
	$(INSTALL) -d $(DESTDIR)$(libdir)
	$(INSTALL) -m 644 $(BUILD_DIR)/debug/lib/$(MINISAT_SLIB) $(DESTDIR)$(libdir)

install-lib: $(BUILD_DIR)/release/lib/$(MINISAT_SLIB) $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE)
	$(INSTALL) -d $(DESTDIR)$(libdir)
	$(INSTALL) -m 644 $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE) $(DESTDIR)$(libdir)
	ln -sf $(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE) $(DESTDIR)$(libdir)/$(MINISAT_DLIB).$(SOMAJOR)
	ln -sf $(MINISAT_DLIB).$(SOMAJOR) $(DESTDIR)$(libdir)/$(MINISAT_DLIB)
	$(INSTALL) -m 644 $(BUILD_DIR)/release/lib/$(MINISAT_SLIB) $(DESTDIR)$(libdir)

install-bin: $(BUILD_DIR)/dynamic/bin/$(MINISAT)
	$(INSTALL) -d $(DESTDIR)$(bindir)
	$(INSTALL) -m 755 $(BUILD_DIR)/dynamic/bin/$(MINISAT) $(DESTDIR)$(bindir)

clean:
	rm -f $(foreach t, release debug profile dynamic, $(wildcard $(BUILD_DIR)/$t/*.cc) $(wildcard $(BUILD_DIR)/$t/*.o) $(wildcard $(BUILD_DIR)/$t/*.d) $(wildcard $(BUILD_DIR)/$t/meteor/logic-solver.*)) \
	  $(foreach t, release debug profile dynamic, $(BUILD_DIR)/$t/bin/$(MINISAT_CORE) $(BUILD_DIR)/$t/bin/$(MINISAT)) \
	  $(foreach t, release debug profile, $(BUILD_DIR)/$t/lib/$(MINISAT_SLIB)) \
	  $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR).$(SOMINOR)$(SORELEASE)\
	  $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB).$(SOMAJOR)\
	  $(BUILD_DIR)/dynamic/lib/$(MINISAT_DLIB) \
	  $(foreach t, release debug profile dynamic, $(foreach msat, minisat mergesat, $(BUILD_DIR)/$t/bin/${msat}-meteor.js $(BUILD_DIR)/$t/bin/${msat}-meteor.wasm ) ) \
	  $(foreach msat, minisat mergesat, $(BUILD_DIR)/$t/bin/${msat}.js)


distclean:	clean
	rm -f config.mk

## Include generated dependencies
-include $(foreach s, $(SRCS:.cc=.d), $(BUILD_DIR)/release/$s)
-include $(foreach s, $(SRCS:.cc=.d), $(BUILD_DIR)/debug/$s)
-include $(foreach s, $(SRCS:.cc=.d), $(BUILD_DIR)/profile/$s)
-include $(foreach s, $(SRCS:.cc=.d), $(BUILD_DIR)/dynamic/$s)
