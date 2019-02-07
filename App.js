import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: [],
      matches: [],
      gaps: [],
      isMatchesLoading: true,
      isStandingsLoading: true,
      isGapsLoading: true
    }
  }

  async getStandings() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/teams/');
      const responseJson = await response.json();
      var teams = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        teams.push({
          position: responseJson.data[i].position,
          id: responseJson.data[i].teamId,
          name: responseJson.data[i].name,
          crest: responseJson.data[i].crest,
          played: responseJson.data[i].played,
          won: responseJson.data[i].won,
          draw: responseJson.data[i].draw,
          lost: responseJson.data[i].lost,
          points: responseJson.data[i].points,
          goalsFor: responseJson.data[i].goalsFor,
          goalsAgainst: responseJson.data[i].goalsAgainst,
          goalsDiff: responseJson.data[i].goalsDiff,
          teamsDiff: {}
        });
      }
      this.setState({
        isStandingsLoading: false,
        standingsData: responseJson,
        teams: teams,
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getMatches() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/matches/');
      const responseJson = await response.json();
      var matches = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        if (responseJson.data[i].status != 'FINISHED'){
          matches.push({
            awayTeamGoals: responseJson.data[i].awayTeamGoals,
            awayTeamId: responseJson.data[i].awayTeamId,
            awayTeamName: responseJson.data[i].awayTeamName,
            homeTeamGoals: responseJson.data[i].homeTeamGoals,
            homeTeamId: responseJson.data[i].homeTeamId,
            homeTeamName: responseJson.data[i].homeTeamName,
            id: responseJson.data[i].id,
            matchId: responseJson.data[i].matchId,
            matchday: responseJson.data[i].matchday,
            status: responseJson.data[i].status,
            utcDate: responseJson.data[i].utcDate
          });
        }
      }
      this.setState({
        isMatchesLoading: false,
        matchesData: responseJson,
        matches: matches
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getGaps() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/gaps/');
      const responseJson = await response.json();
      var gaps = {};
      for (var i = 0; i < responseJson.data.length; i++) {
        gaps[responseJson.data[i].teamId+'_'+responseJson.data[i].awayTeamId] = responseJson.data[i].diff
      }
      this.setState({
        isGapsLoading: false,
        gapsData: responseJson,
        gaps: gaps
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  componentDidMount(){
    this.getStandings();
    this.getMatches();
    this.getGaps();
  }

  render() {
    if(this.state.isMatchesLoading || this.state.isStandingsLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          data={this.state.matches.sort((a, b) => (a.matchday - b.matchday))}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.homeTeamName}{item.homeTeamGoals}{item.awayTeamGoals}{item.awayTeamName}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
          onPress={() => this.props.navigation.navigate('CalculatedTable', {teams: this.state.teams, gaps: this.state.gaps})}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: this.props.navigation.getParam('teams', []),
      gaps: this.props.navigation.getParam('gaps', []),
      orderedTeams: []
    }
  }

  compare(a, b) {
    return b.points - a.points// || b.goalsFor - a.goalsFor
  }

  sortTable() {
    var sortedTeams = []
    var groupBy = function(xs, key) {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

    var teams = this.state.teams//.sort(this.compare)
    var gaps = this.state.gaps
    var groupedTeams = groupBy(teams, 'points')

    for (var key in groupedTeams) {
      if (groupedTeams[key].length < 2) {
        sortedTeams.unshift(groupedTeams[key][0]);
      } else if (groupedTeams[key].length == 2) {
        var teamA = groupedTeams[key][0];
        var teamB = groupedTeams[key][1];
        var diff = gaps[teamA.id]+'_'+gaps[teamB.id] - gaps[teamB.id]+'_'+gaps[teamA.id];
        if (diff < 0) {
          sortedTeams.unshift(teamA);
          sortedTeams.unshift(teamB);
        } else if (diff > 0) {
          sortedTeams.unshift(teamB);
          sortedTeams.unshift(teamA);
        } else {
          var globalDiff = teamA.goalsDiff - teamB.goalsDiff
          if (globalDiff < 0) {
            sortedTeams.unshift(teamA);
            sortedTeams.unshift(teamB);
          } else if (globalDiff > 0) {
            sortedTeams.unshift(teamB);
            sortedTeams.unshift(teamA);
          } else {
            var globalFor = teamA.goalsFor - teamB.goalsFor
            if (globalFor < 0) {
              sortedTeams.unshift(teamA);
              sortedTeams.unshift(teamB);
            } else if (globalFor > 0) {
              sortedTeams.unshift(teamB);
              sortedTeams.unshift(teamA);
            }
          }
        }
      } else if (groupedTeams[key].length > 2) {
        
      }
    }

    this.setState({
      sortedTeams: sortedTeams
    }, function(){

    });
  }

  componentDidMount(){
    this.sortTable();
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
        <FlatList
          data={this.state.teams}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                | {item.name} | {item.points} | {item.goalsFor} |
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'team_'+item.id}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
